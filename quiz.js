/* Class that stores the current user's top tracks and artists (used to personalize the quiz questions).
It has a static method to load the top tracks and artists from the Spotify API. */
class UserTopItems {
    static tracks = {short_term: [], medium_term: [], long_term: []};
    static artists = {short_term: [], medium_term: [], long_term: []};

    static async load() {
        UserTopItems.tracks.short_term = (await getTopItems('tracks', 20, 'short_term'));
        UserTopItems.tracks.medium_term = (await getTopItems('tracks', 20, 'medium_term'));
        UserTopItems.tracks.long_term = (await getTopItems('tracks', 20, 'long_term'));

        UserTopItems.artists.short_term = (await getTopItems('artists', 20, 'short_term'));
        UserTopItems.artists.medium_term = (await getTopItems('artists', 20, 'medium_term'));
        UserTopItems.artists.long_term = (await getTopItems('artists', 20, 'long_term'));
    }
}


/* Class that represents a single question in the quiz.
The constructor takes a question template as a parameter (from the questions.json file)
Methods are used to personalise and set the question, the choices and the answer. */
class Question {
    constructor(questionTemplate) {
        this.question = questionTemplate.question;
        this.choices = [];
        this.answer = '';
        
        // extract the attributes from the question template that are used to personalize the question
        this.type = questionTemplate.type;
        this.timePeriod = questionTemplate.timePeriod;
        this.answerIndex = questionTemplate.answerIndex;

        this.generateChoices(); 
    }

    generateChoices() { 
        this.setAnswer();
        this.setChoices();
    }

    /* Answer generated by using the answerIndex, type and timePeriod attributes
    to extract the answer from the necessary array in the UserTopItems class. */
    setAnswer() {
        // Randomly generates an answerIndex if it is not provided by the question template (so questions are not always the same)
        const maxIndex = UserTopItems[this.type][this.timePeriod].length - 3;
        if (isNaN(this.answerIndex)) {
            this.answerIndex = Math.floor(Math.random() * maxIndex);
        }

        if (this.type === 'tracks') {
            this.answer = UserTopItems.tracks[this.timePeriod][this.answerIndex].name;
        }
        else if (this.type === 'artists') {
            this.answer = UserTopItems.artists[this.timePeriod][this.answerIndex].name;
        }
    }


    /* Choices generated by using the answerIndex, type and timePeriod attributes
    to extract the next 3 items from the necessary array in the UserTopItems class. */
    setChoices() {
        for (let i = this.answerIndex; i < this.answerIndex + 4; i++) { 
            if (this.type === 'tracks') {
                this.choices.push(UserTopItems.tracks[this.timePeriod][i].name);
            }
            else if (this.type === 'artists') {
                this.choices.push(UserTopItems.artists[this.timePeriod][i].name);
            }
        }
    }

    isCorrectAnswer(choice) {
        return this.answer === choice;
    }
}


/* The Quiz class generates a quiz with 10 random questions from the questions.json file
and displays them to the user. It also keeps track of the user's score. */
class Quiz {
    constructor() {
        this.questions = [];
        this.score = 0;
        this.currentQuestionIndex = 0;
    }

    /* Starts the quiz by loading the questions from
    the questions.json file and displaying the first question. */
    async start() {
        await this.generateQuestions();
        QuizUI.startQuiz();
        this.getCurrentQuestion();        
    }

    /* Loads the questions templates from the questions.json file and
    generates 10 new question objects using 10 random question templates. */
    async generateQuestions() {
        const response = await fetch('/questions.json');
        const questionTemplates = await response.json();
        const questions = [];
        let randomQuestionIndex = 0;
        
        while (questions.length < 10) { 
            randomQuestionIndex = Math.floor(Math.random() * questionTemplates.length); 
            questions.push(new Question(questionTemplates[randomQuestionIndex]));
            questionTemplates.splice(randomQuestionIndex, 1);
        }
        this.questions = questions;
    }

    /* Gets the current question and updates the UI to display it. */
    getCurrentQuestion() { 
        const currentQuestion = this.questions[this.currentQuestionIndex];
        const questionNumber = this.currentQuestionIndex + 1;
        const choices = currentQuestion.choices;

        QuizUI.displayQuestion(currentQuestion.question, questionNumber, choices, this);
    }

    checkAnswer(choice) {
        const isCorrect = this.questions[this.currentQuestionIndex].isCorrectAnswer(choice);
        if (isCorrect) {
            this.score++;
        }
        // Shows the user if their answer was correct and allows them to move on to the next question
        QuizUI.displayQuestionAnswered(isCorrect, this);
    }

    /* Method called when the user clicks the 'next question' button.
    Displays the next question if there are more questions left, otherwise ends the quiz. */
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) { 
            this.currentQuestionIndex++;
            this.getCurrentQuestion();
        }
        else {
            this.end();
        }
    }

    end() {
        QuizUI.displayQuizResults(this.score, this.questions.length);
    }
}

/* Class that handles the UI of the quiz.
Contains static methods that are used to update the UI when called by the Quiz class. */
class QuizUI {
    static quizInfo = document.getElementById('quizInfo');
    static quiz = document.getElementById('quiz');
    
    static questionHeading = document.getElementById('question');
    static choicesSection = document.getElementById('choicesSection');

    static questionAnswered = document.getElementById('questionAnswered');
    static answerFeedback = document.getElementById('answerFeedback');
    static nextQuestionButtonSection = document.getElementById('nextQuestionButtonSection');

    static quizResults = document.getElementById('quizResults');
    static quizScore = document.getElementById('quizScore');

    /* Starts quiz by hiding all the UI besides the quiz section. */
    static startQuiz() {
        QuizUI.quizInfo.style.display = 'none';
        QuizUI.quiz.style.display = 'block';
        QuizUI.quizResults.style.display = 'none';
    }

    static displayQuestion(question, questionNumber, choices, quiz) {
        this.choicesSection.innerHTML = '';
        this.questionAnswered.style.display = 'none';
        this.displayQuestionHeading(question, questionNumber);
        this.displayQuestionChoicesRandomly(choices, quiz);
    }

    static displayQuestionHeading(question, questionNumber) {
        this.questionHeading.innerHTML = `Question ${questionNumber}<br>${question}`;
    }

    static displayQuestionChoicesRandomly(choices, quiz) {
        let randomChoiceIndex = 0;
        while (choices.length > 0) {
            randomChoiceIndex = Math.floor(Math.random() * choices.length);
            this.displayChoice(choices[randomChoiceIndex], quiz);
            choices.splice(randomChoiceIndex, 1);
        }
    }

    /* Displays each choice as a button that the
    user can click on to answer the question. */
    static displayChoice(choice, quiz) { 
        const choiceButton = document.createElement('button');
        choiceButton.className = 'choiceButton';
        choiceButton.innerHTML = choice;
        choiceButton.addEventListener('click', () => {
            quiz.checkAnswer(choice);
            choiceButton.style.color = '#ff2464';
        });
        this.choicesSection.appendChild(choiceButton);
    }

    /* Handles the UI when the user answers a question 
    and disables the choice buttons so that the user can't change their answer. */
    static displayQuestionAnswered(isCorrect, quiz) { 
        const choiceButtons = document.getElementsByClassName('choiceButton');
        for (let i = 0; i < choiceButtons.length; i++) {
            choiceButtons[i].disabled = true;
        }
        this.questionAnswered.style.display = 'block';
        this.displayAnswerFeedback(isCorrect);
        this.displayNextQuestionButton(quiz);
    }

    static displayAnswerFeedback(isCorrect) {
        if (isCorrect) {
            this.answerFeedback.innerHTML = 'Correct!';
        }
        else {
            this.answerFeedback.innerHTML = 'Incorrect!';
        }
    }

    static displayNextQuestionButton(quiz) {
        const nextQuestionButton = document.createElement('button');
        nextQuestionButton.innerHTML = 'Next Question';
        // Allows user to click on button to go to next question
        nextQuestionButton.addEventListener('click', () => {
            quiz.nextQuestion();
            this.nextQuestionButtonSection.innerHTML = '';
        });
        this.nextQuestionButtonSection.appendChild(nextQuestionButton);
    }

    static displayQuizResults(score, totalQuestions) {
        this.quiz.style.display = 'none';
        this.quizResults.style.display = 'block';
        this.quizScore.innerHTML = `You scored ${score} out of ${totalQuestions}!`;
    }
}

async function startQuiz () {
    await UserTopItems.load();
    const quiz = new Quiz();
    quiz.start();
}

async function restartQuiz() {
    const quiz = new Quiz();
    quiz.start();
}

