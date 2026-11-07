package com.vocab.enterprise.config;

import com.vocab.enterprise.model.*;
import com.vocab.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final PyqExamRepository pyqExamRepository;
    private final PyqPaperRepository pyqPaperRepository;
    private final QuestionSheetCategoryRepository questionSheetCategoryRepository;
    private final QuestionSheetPaperRepository questionSheetPaperRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Initializing default system users...");

        // Ensure MySQL table columns file_url are LONGTEXT so large Base64 PDFs are not truncated
        try {
            jdbcTemplate.execute("ALTER TABLE pyq_papers MODIFY COLUMN file_url LONGTEXT");
            jdbcTemplate.execute("ALTER TABLE question_sheet_papers MODIFY COLUMN file_url LONGTEXT");
            log.info("Successfully altered pyq_papers and question_sheet_papers file_url columns to LONGTEXT.");
        } catch (Exception e) {
            log.warn("Notice: Column alteration check: {}", e.getMessage());
        }

        // Seed Manager User ONCE if missing in MySQL DB
        if (!userRepository.existsByEmail("surajshah1509@gmail.com")) {
            User manager = User.builder()
                    .username("surajshah1509")
                    .email("surajshah1509@gmail.com")
                    .password(passwordEncoder.encode("Suraj9981"))
                    .fullName("Suraj Shah")
                    .role(User.Role.MANAGER)
                    .currentStreak(7)
                    .totalXp(1250)
                    .build();
            manager = userRepository.save(manager);

            final Long managerId = manager.getId();
            if (!userPermissionRepository.findByUserId(managerId).isPresent()) {
                String defaultManagerPerms = "{\"synonyms\":true,\"antonyms\":true,\"idioms\":true,\"oneWord\":true,\"homonyms\":true,\"rootWords\":true,\"dayWiseTest\":true,\"sectionalTest\":true,\"pyqQuestion\":true,\"questionSheet\":true}";
                String defaultCrud = "{\"canCreateWord\":true,\"canEditWord\":true,\"canDeleteWord\":true,\"canManageUsers\":true,\"canImportExport\":true,\"canCreateTest\":true}";
                userPermissionRepository.save(UserPermission.builder()
                        .userId(managerId)
                        .role("MANAGER")
                        .studentPermissionsJson(defaultManagerPerms)
                        .crudPermissionsJson(defaultCrud)
                        .build());
            }
            log.info("Manager user surajshah1509@gmail.com initialized successfully.");
        }

        // Seed Sample Student ONCE if missing in MySQL DB
        if (!userRepository.existsByEmail("student@vocab.com")) {
            User student = User.builder()
                    .username("student1")
                    .email("student@vocab.com")
                    .password(passwordEncoder.encode("student123"))
                    .fullName("Rahul Kumar")
                    .role(User.Role.STUDENT)
                    .currentStreak(3)
                    .totalXp(450)
                    .build();
            student = userRepository.save(student);

            final Long studentId = student.getId();
            if (!userPermissionRepository.findByUserId(studentId).isPresent()) {
                String defaultPerms = "{\"synonyms\":true,\"antonyms\":true,\"idioms\":true,\"rootWords\":true,\"oneWord\":true,\"dayWiseTest\":true,\"sectionalTest\":true,\"pyqQuestion\":true,\"questionSheet\":true}";
                userPermissionRepository.save(UserPermission.builder()
                        .userId(studentId)
                        .role("STUDENT")
                        .studentPermissionsJson(defaultPerms)
                        .crudPermissionsJson("{}")
                        .build());
            }
            log.info("Sample student user student@vocab.com initialized successfully.");
        }

        // Seed Manoj Student ONCE if missing in MySQL DB
        if (!userRepository.existsByEmail("manoj1509@gmail.com")) {
            User manoj = User.builder()
                    .username("manoj1509")
                    .email("manoj1509@gmail.com")
                    .password(passwordEncoder.encode("manoj123"))
                    .fullName("Manoj Kumar")
                    .role(User.Role.STUDENT)
                    .currentStreak(5)
                    .totalXp(650)
                    .build();
            manoj = userRepository.save(manoj);

            final Long manojId = manoj.getId();
            if (!userPermissionRepository.findByUserId(manojId).isPresent()) {
                String defaultPerms = "{\"synonyms\":true,\"antonyms\":true,\"idioms\":true,\"oneWord\":false,\"homonyms\":false,\"rootWords\":false,\"dayWiseTest\":true,\"sectionalTest\":false,\"pyqQuestion\":true,\"questionSheet\":true}";
                userPermissionRepository.save(UserPermission.builder()
                        .userId(manojId)
                        .role("STUDENT")
                        .studentPermissionsJson(defaultPerms)
                        .crudPermissionsJson("{}")
                        .build());
            }
            log.info("Manoj student user manoj1509@gmail.com initialized successfully.");
        }

        // Seed PYQ Exams ONCE if missing in MySQL DB
        if (pyqExamRepository.count() == 0) {
            pyqExamRepository.save(PyqExam.builder().title("SSC CGL").description("Combined Graduate Level Exam Papers").category("SSC").countText("2 Papers").build());
            pyqExamRepository.save(PyqExam.builder().title("SSC CHSL").description("Combined Higher Secondary Level Papers").category("SSC").countText("1 Paper").build());
            pyqExamRepository.save(PyqExam.builder().title("RRB NTPC").description("Railway Recruitment Board Non-Technical").category("Railway").countText("1 Paper").build());
            pyqExamRepository.save(PyqExam.builder().title("TCS NQT").description("National Qualifier Test Previous Papers").category("Corporate").countText("1 Paper").build());
            log.info("Default PYQ Exams seeded into MySQL database.");
        }

        // Seed PYQ Papers ONCE if missing in MySQL DB
        if (pyqPaperRepository.count() == 0) {
            pyqPaperRepository.save(PyqPaper.builder().examTitle("SSC CGL").paperName("SSC CGL 2023 Tier-1 Official Paper Shift-1").fileSize("2.8 MB").fileType("PDF").addedDate("04 Oct 2026").fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf").build());
            pyqPaperRepository.save(PyqPaper.builder().examTitle("SSC CGL").paperName("SSC CGL 2023 Tier-2 Main Examination Question Paper").fileSize("4.1 MB").fileType("PDF").addedDate("02 Oct 2026").fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf").build());
            pyqPaperRepository.save(PyqPaper.builder().examTitle("SSC CHSL").paperName("SSC CHSL 2023 Tier-1 English Memory Based Paper").fileSize("1.9 MB").fileType("PDF").addedDate("01 Oct 2026").fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf").build());
            pyqPaperRepository.save(PyqPaper.builder().examTitle("RRB NTPC").paperName("RRB NTPC CBT-2 General Intelligence & English Paper").fileSize("3.2 MB").fileType("PDF").addedDate("28 Sep 2026").fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf").build());
            pyqPaperRepository.save(PyqPaper.builder().examTitle("TCS NQT").paperName("TCS NQT Verbal Ability Official Practice Paper 2024").fileSize("2.1 MB").fileType("PDF").addedDate("25 Sep 2026").fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf").build());
            log.info("Default PYQ Papers seeded into MySQL database.");
        }

        // Seed Question Sheet Categories ONCE if missing in MySQL DB
        if (questionSheetCategoryRepository.count() == 0) {
            questionSheetCategoryRepository.save(QuestionSheetCategory.builder().title("Vocabulary Special Sheet").description("500 High Frequency Synonyms & Antonyms").countText("1 Sheet").build());
            questionSheetCategoryRepository.save(QuestionSheetCategory.builder().title("Grammar Practice Sheet").description("Error Spotting & Sentence Improvement").countText("1 Sheet").build());
            questionSheetCategoryRepository.save(QuestionSheetCategory.builder().title("Reading Comprehension Sheet").description("Passage Practice & Inference Questions").countText("0 Sheets").build());
            questionSheetCategoryRepository.save(QuestionSheetCategory.builder().title("Cloze Test Practice Sheet").description("Fill in the blanks with context clues").countText("0 Sheets").build());
            log.info("Default Question Sheet Categories seeded into MySQL database.");
        }

        // Seed Question Sheet Papers ONCE if missing in MySQL DB
        if (questionSheetPaperRepository.count() == 0) {
            questionSheetPaperRepository.save(QuestionSheetPaper.builder().categoryTitle("Vocabulary Special Sheet").paperName("Top 200 Root Words & Synonyms Master Sheet 2024.pdf").fileSize("1.5 MB").fileType("PDF").addedDate("05 Oct 2026").fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf").build());
            questionSheetPaperRepository.save(QuestionSheetPaper.builder().categoryTitle("Grammar Practice Sheet").paperName("100 Golden Rules of Grammar Exercise Sheet.pdf").fileSize("2.3 MB").fileType("PDF").addedDate("03 Oct 2026").fileUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf").build());
            log.info("Default Question Sheet Papers seeded into MySQL database.");
        }
    }
}
