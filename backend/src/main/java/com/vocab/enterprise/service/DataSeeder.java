package com.vocab.enterprise.service;

import com.vocab.enterprise.model.*;
import com.vocab.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ChapterRepository chapterRepository;
    private final WordRepository wordRepository;
    private final QuestionRepository questionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsers();
        } else {
            seedAdminIfNotExists();
        }
        if (chapterRepository.count() == 0) {
            seedVocabData();
        }
    }

    private void seedUsers() {
        User student = User.builder()
                .username("student")
                .email("student@vocab.com")
                .password(passwordEncoder.encode("password123"))
                .fullName("Rahul Sharma")
                .role(User.Role.STUDENT)
                .currentStreak(5)
                .totalXp(350)
                .build();

        User manager = User.builder()
                .username("manager")
                .email("manager@vocab.com")
                .password(passwordEncoder.encode("admin123"))
                .fullName("Priya Verma (Content Lead)")
                .role(User.Role.MANAGER)
                .currentStreak(12)
                .totalXp(1200)
                .build();

        User admin = User.builder()
                .username("surajshah1509")
                .email("surajshah1509@gmail.com")
                .password(passwordEncoder.encode("Suraj@9981"))
                .fullName("Suraj Shah")
                .role(User.Role.ADMIN)
                .currentStreak(15)
                .totalXp(2500)
                .build();

        userRepository.saveAll(List.of(student, manager, admin));
    }

    private void seedAdminIfNotExists() {
        userRepository.findByEmail("surajshah1509@gmail.com").ifPresentOrElse(
            existing -> {
                existing.setPassword(passwordEncoder.encode("Suraj@9981"));
                existing.setRole(User.Role.ADMIN);
                existing.setUsername("surajshah1509");
                existing.setFullName("Suraj Shah");
                userRepository.save(existing);
            },
            () -> {
                User admin = User.builder()
                        .username("surajshah1509")
                        .email("surajshah1509@gmail.com")
                        .password(passwordEncoder.encode("Suraj@9981"))
                        .fullName("Suraj Shah")
                        .role(User.Role.ADMIN)
                        .currentStreak(15)
                        .totalXp(2500)
                        .build();
                userRepository.save(admin);
            }
        );
    }

    private void seedVocabData() {
        // Day 1 Chapter
        Chapter day1 = Chapter.builder()
                .dayNumber(1)
                .title("Day 1: Workplace Excellence & Communication")
                .description("Master enterprise business English & daily office communication vocabulary.")
                .iconName("briefcase")
                .build();

        day1 = chapterRepository.save(day1);

        // 15 Revision Words (Previously Learned)
        List<Word> revisionWords = List.of(
            Word.builder().chapter(day1).word("Articulate").phonetic("/ɑːrˈtɪk.jə.lət/").meaning("Expressing oneself clearly and effectively.").hindiMeaning("स्पष्ट बोलना / अभिव्यक्ति").exampleSentence("She gave an articulate presentation to the executive board.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Collaborate").phonetic("/kəˈlæb.ə.reɪt/").meaning("To work jointly with others on an activity or project.").hindiMeaning("सहयोग करना").exampleSentence("Teams collaborate across different time zones using modern software.").partOfSpeech("Verb").build(),
            Word.builder().chapter(day1).word("Diligent").phonetic("/ˈdɪl.ə.dʒənt/").meaning("Showing care and conscientiousness in work.").hindiMeaning("परिश्रमी / निष्ठावान").exampleSentence("His diligent effort led to the successful launch of the app.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Benchmark").phonetic("/ˈbentʃ.mɑːrk/").meaning("A standard or point of reference for comparison.").hindiMeaning("मानदंड / परिमाण").exampleSentence("Our product set a new quality benchmark in the tech industry.").partOfSpeech("Noun").build(),
            Word.builder().chapter(day1).word("Pragmatic").phonetic("/præɡˈmæt.ɪk/").meaning("Dealing with things sensibly and realistically.").hindiMeaning("व्यावहारिक").exampleSentence("We need a pragmatic solution to meet the deadline efficiently.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Resilient").phonetic("/rɪˈzɪl.jənt/").meaning("Able to withstand or recover quickly from difficult conditions.").hindiMeaning("लचीला / सहनशील").exampleSentence("The enterprise cloud infrastructure is highly resilient.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Synergy").phonetic("/ˈsɪn.ɚ.dʒi/").meaning("Interaction producing a combined effect greater than the sum.").hindiMeaning("सह-क्रिया / तालमेल").exampleSentence("The merger created great financial synergy between both companies.").partOfSpeech("Noun").build(),
            Word.builder().chapter(day1).word("Proactive").phonetic("/proʊˈæk.tɪv/").meaning("Creating or controlling a situation rather than responding to it.").hindiMeaning("सक्रिय / अग्रसक्रिय").exampleSentence("Taking a proactive approach prevents critical software bugs.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Optimise").phonetic("/ˈɑːp.tə.maɪz/").meaning("Make the best or most effective use of a situation or resource.").hindiMeaning("इष्टतम बनाना").exampleSentence("Engineers optimise database queries for fast response time.").partOfSpeech("Verb").build(),
            Word.builder().chapter(day1).word("Mitigate").phonetic("/ˈmɪt̬.ə.ɡeɪt/").meaning("Make less severe, serious, or painful.").hindiMeaning("कम करना / घटाना").exampleSentence("Unit testing helps mitigate technical risks in production.").partOfSpeech("Verb").build(),
            Word.builder().chapter(day1).word("Feasible").phonetic("/ˈfiː.zə.bəl/").meaning("Possible to do easily or conveniently.").hindiMeaning("संभव / व्यवहार्य").exampleSentence("Building a mobile MVP within two weeks is feasible.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Leverage").phonetic("/ˈlev.ɚ.ɪdʒ/").meaning("Use something to maximum advantage.").hindiMeaning("लाभ उठाना / उपयोग करना").exampleSentence("We leverage AI tools to accelerate development speed.").partOfSpeech("Verb").build(),
            Word.builder().chapter(day1).word("Agile").phonetic("/ˈædʒ.əl/").meaning("Able to move quickly and easily in response to change.").hindiMeaning("फुर्तीला / द्रुत").exampleSentence("Agile methodology encourages rapid iterative development.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Empower").phonetic("/ɪmˈpaʊ.ɚ/").meaning("Give someone the authority or power to do something.").hindiMeaning("सशक्त बनाना").exampleSentence("Managers empower developers to make technical design choices.").partOfSpeech("Verb").build(),
            Word.builder().chapter(day1).word("Paramount").phonetic("/ˈpær.ə.maʊnt/").meaning("More important than anything else; supreme.").hindiMeaning("सर्वोपरि / मुख्य").exampleSentence("Data privacy and cyber security are of paramount importance.").partOfSpeech("Adjective").build()
        );

        // 10 New Words
        List<Word> newWords = List.of(
            Word.builder().chapter(day1).word("Ubiquitous").phonetic("/juːˈbɪk.wə.t̬əs/").meaning("Present, appearing, or found everywhere.").hindiMeaning("सर्वव्यापी / हर जगह मौजूद").exampleSentence("Smartphones have become ubiquitous in modern global culture.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Meticulous").phonetic("/məˈtɪk.jə.ləs/").meaning("Showing great attention to detail; very careful and precise.").hindiMeaning("अति सावधान / सूक्ष्म").exampleSentence("The code review was executed with meticulous attention to detail.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Exemplary").phonetic("/ɪɡˈzem.plɚ.i/").meaning("Serving as a desirable model; representing the best.").hindiMeaning("अनुकरणीय / मिसाल").exampleSentence("Her exemplary leadership earned her the Employee of the Year award.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Innovate").phonetic("/ˈɪn.ə.veɪt/").meaning("Make changes in something established, especially by introducing new methods.").hindiMeaning("नवीनता लाना / नवप्रवर्तन").exampleSentence("Tech companies must constantly innovate to maintain market leadership.").partOfSpeech("Verb").build(),
            Word.builder().chapter(day1).word("Consensus").phonetic("/kənˈsen.səs/").meaning("A general agreement among a group of people.").hindiMeaning("सर्वसम्मति / सहमति").exampleSentence("The committee reached a consensus on the new architecture plan.").partOfSpeech("Noun").build(),
            Word.builder().chapter(day1).word("Integrity").phonetic("/ɪnˈteɡ.rə.t̬i/").meaning("The quality of being honest and having strong moral principles.").hindiMeaning("इमानदारी / अखंडता").exampleSentence("Professional integrity builds long-term customer trust.").partOfSpeech("Noun").build(),
            Word.builder().chapter(day1).word("Scalable").phonetic("/ˈskeɪ.lə.bəl/").meaning("Capable of being easily expanded or upgraded on demand.").hindiMeaning("प्रसारणीय / स्केलेबल").exampleSentence("Spring Boot architecture is highly scalable for high-traffic apps.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Versatile").phonetic("/ˈvɝː.sə.t̬əl/").meaning("Able to adapt or be adapted to many different functions.").hindiMeaning("बहुमुखी / सर्वगुण संपन्न").exampleSentence("React Native is a versatile framework for multi-platform apps.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Plausible").phonetic("/ˈplɑː.zə.bəl/").meaning("Seeming reasonable or probable.").hindiMeaning("विश्वसनीय / तर्कसंगत").exampleSentence("The team provided a plausible explanation for the network latency.").partOfSpeech("Adjective").build(),
            Word.builder().chapter(day1).word("Synchronize").phonetic("/ˈsɪŋ.krə.naɪz/").meaning("Cause to occur or operate at the same time or rate.").hindiMeaning("समकालिक करना").exampleSentence("The mobile client synchronizes data with the backend MySQL server.").partOfSpeech("Verb").build()
        );

        wordRepository.saveAll(revisionWords);
        wordRepository.saveAll(newWords);

        // Seed 5 Daily Test Questions
        List<Question> questions = List.of(
            Question.builder().chapter(day1).questionText("What is the meaning of 'Ubiquitous'?").optionA("Rarely seen").optionB("Present everywhere").optionC("Difficult to speak").optionD("Temporary").correctOption("B").explanation("'Ubiquitous' means found or present everywhere.").build(),
            Question.builder().chapter(day1).questionText("Select the word that means 'Expressing oneself clearly and effectively':").optionA("Articulate").optionB("Meticulous").optionC("Agile").optionD("Mitigate").correctOption("A").explanation("'Articulate' refers to clear and effective expression.").build(),
            Question.builder().chapter(day1).questionText("Choose the correct synonym for 'Meticulous':").optionA("Careless").optionB("Precise & Careful").optionC("Hasty").optionD("Lazy").correctOption("B").explanation("'Meticulous' means showing great attention to detail and precision.").build(),
            Question.builder().chapter(day1).questionText("What does 'Pragmatic' mean in a business context?").optionA("Idealistic").optionB("Unrealistic").optionC("Practical & Realistic").optionD("Theoretical").correctOption("C").explanation("Pragmatic means dealing with matters in a practical and sensible way.").build(),
            Question.builder().chapter(day1).questionText("Which word describes software capable of handling expanding workloads?").optionA("Scalable").optionB("Feasible").optionC("Plausible").optionD("Empower").correctOption("A").explanation("'Scalable' means capable of being easily expanded or upgraded.").build()
        );

        questionRepository.saveAll(questions);
    }
}
