/**
 * PermissionContext — Enterprise-grade Real-time Permission Management
 *
 * Architecture:
 * 1. On login  -> fetch permissions from DB via REST API
 * 2. Always    -> WebSocket (STOMP/SockJS) subscription to /topic/permissions/{userId}
 * 3. On update -> backend broadcasts, this context updates instantly (zero polling)
 *
 * All components use `usePermissions()` hook — single source of truth.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { managerApi } from '../api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StudentPermissions {
  synonyms?: boolean;
  antonyms?: boolean;
  idioms?: boolean;
  oneWord?: boolean;
  homonyms?: boolean;
  rootWords?: boolean;
  dayWiseTest?: boolean;
  sectionalTest?: boolean;
  pyqQuestion?: boolean;
  questionSheet?: boolean;
  [key: string]: boolean | undefined;
}

export interface CrudPermissions {
  canCreateWord?: boolean;
  canEditWord?: boolean;
  canDeleteWord?: boolean;
  canManageUsers?: boolean;
  [key: string]: boolean | undefined;
}

export interface PermissionState {
  /** Is permission data fully loaded? */
  loaded: boolean;
  /** Role from DB: STUDENT | MANAGER | ADMIN | STAFF */
  role: string;
  /** Granular feature permissions for student modules */
  student: StudentPermissions;
  /** CRUD permissions for manager/admin roles */
  crud: CrudPermissions;
  /** WebSocket connection status */
  wsConnected: boolean;
}

interface PermissionContextValue {
  permissions: PermissionState;
  /**
   * Call this right after login.
   * loginData = full login/register API response (can include studentPermissionsJson / crudPermissionsJson)
   * If loginData is provided, permissions are applied immediately — no extra API round-trip.
   */
  initPermissions: (userId: number, role: string, loginData?: any) => void;
  /** Clears permissions on logout */
  clearPermissions: () => void;
  /** Convenience: check if a specific student module is accessible */
  canAccess: (module: keyof StudentPermissions) => boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default / Empty state
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PERMISSIONS: PermissionState = {
  loaded: false,
  role: 'STUDENT',
  student: {},
  crud: {},
  wsConnected: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const PermissionContext = createContext<PermissionContextValue>({
  permissions: DEFAULT_PERMISSIONS,
  initPermissions: () => { },
  clearPermissions: () => { },
  canAccess: () => true,
});

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket / STOMP setup (lightweight — no external library needed)
// Uses native WebSocket with raw STOMP frames over SockJS websocket transport
// ─────────────────────────────────────────────────────────────────────────────

const WS_BASE = 'ws://localhost:8085'; // Spring Boot backend WebSocket

/** Minimal STOMP frame builder */
const buildStompFrame = (command: string, headers: Record<string, string> = {}, body = '') => {
  let frame = command + '\n';
  Object.entries(headers).forEach(([k, v]) => { frame += k + ':' + v + '\n'; });
  frame += '\n' + body + '\0';
  return frame;
};

/** Parse an incoming STOMP frame */
const parseStompFrame = (data: string) => {
  const nullIdx = data.indexOf('\0');
  const frameStr = nullIdx >= 0 ? data.substring(0, nullIdx) : data;
  const headerBodySplit = frameStr.indexOf('\n\n');
  const headerPart = headerBodySplit >= 0 ? frameStr.substring(0, headerBodySplit) : frameStr;
  const body = headerBodySplit >= 0 ? frameStr.substring(headerBodySplit + 2) : '';
  const lines = headerPart.split('\n');
  const command = lines[0] || '';
  const headers: Record<string, string> = {};
  lines.slice(1).forEach(l => {
    const idx = l.indexOf(':');
    if (idx > 0) headers[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
  });
  return { command, headers, body };
};

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<PermissionState>(DEFAULT_PERMISSIONS);

  const userIdRef = useRef<number | null>(null);
  const roleRef = useRef<string>('STUDENT');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // ── Apply raw API response to state ───────────────────────────────────────
  const applyPermissionResponse = useCallback((raw: any, role: string) => {
    if (!mountedRef.current) return;

    let student: StudentPermissions = {};
    let crud: CrudPermissions = {};

    try {
      if (raw && raw.studentPermissionsJson) {
        student = JSON.parse(raw.studentPermissionsJson);
      }
    } catch (e) { /* keep empty */ }

    try {
      if (raw && raw.crudPermissionsJson) {
        crud = JSON.parse(raw.crudPermissionsJson);
      }
    } catch (e) { /* keep empty */ }

    const dbRole = (raw && raw.role) ? raw.role : role;

    setPermissions(prev => ({
      ...prev,
      loaded: true,
      role: dbRole,
      student,
      crud,
    }));
  }, []);

  // ── REST: fetch permissions from DB ────────────────────────────────────────
  const fetchPermissionsFromDb = useCallback(async (userId: number, role: string) => {
    try {
      const res = await managerApi.getUserPermissions(userId);
      applyPermissionResponse(res, role);
    } catch (err) {
      console.warn('[PermissionCtx] REST fetch failed, using role defaults:', err);
      applyPermissionResponse(null, role);
    }
  }, [applyPermissionResponse]);

  // ── WebSocket: connect + subscribe ────────────────────────────────────────
  const connectWebSocket = useCallback((userId: number, role: string) => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) { }
      wsRef.current = null;
    }

    // Try SockJS websocket transport path first
    const wsUrl = 'ws://localhost:8085/ws/websocket';

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      console.warn('[WS] WebSocket not supported, using REST polling only');
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected — sending STOMP CONNECT');
      ws.send(buildStompFrame('CONNECT', {
        'accept-version': '1.1,1.0',
        'heart-beat': '10000,10000',
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      const data = event.data as string;
      if (!data || data === '\n') return; // heartbeat

      const frame = parseStompFrame(data);

      if (frame.command === 'CONNECTED') {
        console.log('[WS] STOMP CONNECTED — subscribing to /topic/permissions/' + userId);
        ws.send(buildStompFrame('SUBSCRIBE', {
          id: 'perm-sub-0',
          destination: '/topic/permissions/' + userId,
        }));
        setPermissions(prev => ({ ...prev, wsConnected: true }));
      }

      if (frame.command === 'MESSAGE') {
        console.log('[WS] Permission update received!');
        try {
          const updated = JSON.parse(frame.body);
          applyPermissionResponse(updated, role);
        } catch (e) {
          console.warn('[WS] Parse error on permission payload:', e);
        }
      }
    };

    ws.onclose = () => {
      console.warn('[WS] Connection closed');
      if (!mountedRef.current) return;
      setPermissions(prev => ({ ...prev, wsConnected: false }));

      // Auto-reconnect after 5s
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current && userIdRef.current !== null) {
          console.log('[WS] Reconnecting...');
          connectWebSocket(userIdRef.current, roleRef.current);
        }
      }, 5000);
    };

    ws.onerror = () => {
      console.warn('[WS] WebSocket error — will fall back to REST polling');
    };
  }, [applyPermissionResponse]);

  // ── Fallback REST polling (only when WS is NOT connected) ─────────────────
  useEffect(() => {
    if (permissions.wsConnected || !permissions.loaded) return;
    if (userIdRef.current === null) return;

    const pollInterval = setInterval(() => {
      if (userIdRef.current !== null) {
        fetchPermissionsFromDb(userIdRef.current, roleRef.current);
      }
    }, 10000); // 10s fallback poll

    return () => clearInterval(pollInterval);
  }, [permissions.wsConnected, permissions.loaded, fetchPermissionsFromDb]);

  // ── Public API ─────────────────────────────────────────────────────────────

  const initPermissions = useCallback((userId: number, role: string, loginData?: any) => {
    userIdRef.current = userId;
    roleRef.current = role;

    // Step 1: If login response already has permissions, apply immediately (zero lag)
    if (loginData && (loginData.studentPermissionsJson || loginData.crudPermissionsJson)) {
      console.log('[PermissionCtx] Applying permissions from login response instantly');
      applyPermissionResponse(loginData, role);
    } else {
      // Fallback: REST fetch from DB
      fetchPermissionsFromDb(userId, role);
    }

    // Step 2: Real-time WebSocket connection (always establish for live updates)
    connectWebSocket(userId, role);
  }, [fetchPermissionsFromDb, connectWebSocket, applyPermissionResponse]);

  const clearPermissions = useCallback(() => {
    userIdRef.current = null;
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) { }
      wsRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    setPermissions(DEFAULT_PERMISSIONS);
  }, []);

  const canAccess = useCallback((module: keyof StudentPermissions): boolean => {
    // Admin / Manager / Staff → always full access
    const roleUpper = (permissions.role || '').toUpperCase();
    if (roleUpper === 'ADMIN' || roleUpper === 'MANAGER' || roleUpper === 'STAFF') {
      return true;
    }

    // Permissions not yet loaded from DB → default allow (loading state)
    if (!permissions.loaded) {
      return true;
    }

    // DB permission flag exists → honour it exactly
    if (permissions.student && typeof permissions.student[module] === 'boolean') {
      return permissions.student[module] === true;
    }

    // No specific flag set in DB → allow by default for STUDENT
    return true;
  }, [permissions]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (wsRef.current) { try { wsRef.current.close(); } catch (e) { } }
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  return (
    <PermissionContext.Provider value={{ permissions, initPermissions, clearPermissions, canAccess }}>
      {children}
    </PermissionContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook — use in any component
// ─────────────────────────────────────────────────────────────────────────────

export const usePermissions = () => useContext(PermissionContext);
