(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = {
    books: [],
    currentChapter: null,
    quiz: [],
    index: 0,
    answers: [],
    mode: "practice",
    selectedBook: "",
    selectedChapter: ""
  };

  const storage = {
    get(key, fallback = null) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
  };

  function show(id) {
    ["screenHome","screenQuiz","screenResults","screenAbout"].forEach(x => $(x).classList.add("hidden"));
    $(id).classList.remove("hidden");
    window.scrollTo({top:0, behavior:"smooth"});
  }

  async function loadJSON(path) {
    const response = await fetch(path, {cache:"no-cache"});
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.json();
  }

  async function init() {
    try {
      const config = await loadJSON("data/books.json");
      state.books = config.books || [];
      $("brandName").textContent = config.siteName || "Book Quiz";
      $("homeIntro").textContent = config.description || $("homeIntro").textContent;
      populateBooks();
      updateStats();
      registerPWA();
    } catch (error) {
      $("homeStatus").textContent = "Could not load the quiz catalogue. Check the data files and deployment.";
      console.error(error);
    }
  }

  function populateBooks() {
    const select = $("bookSelect");
    select.innerHTML = "";
    state.books.forEach(book => {
      const opt = document.createElement("option");
      opt.value = book.id; opt.textContent = book.title;
      select.appendChild(opt);
    });
    if (state.books.length) {
      state.selectedBook = state.books[0].id;
      select.value = state.selectedBook;
      populateChapters();
    }
  }

  function populateChapters() {
    const book = state.books.find(b => b.id === $("bookSelect").value);
    const select = $("chapterSelect");
    select.innerHTML = "";
    (book?.chapters || []).forEach(chapter => {
      const opt = document.createElement("option");
      opt.value = chapter.id;
      opt.textContent = `${chapter.number ? chapter.number + ". " : ""}${chapter.title}`;
      select.appendChild(opt);
    });
    state.selectedBook = book?.id || "";
    state.selectedChapter = book?.chapters?.[0]?.id || "";
    if (state.selectedChapter) select.value = state.selectedChapter;
    updateChapterInfo();
  }

  async function getChapter() {
    const book = state.books.find(b => b.id === $("bookSelect").value);
    const meta = book?.chapters?.find(c => c.id === $("chapterSelect").value);
    if (!meta) throw new Error("Chapter not found.");
    const data = await loadJSON(meta.file);
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error("This chapter has no questions.");
    }
    return {...data, ...meta};
  }

  async function updateChapterInfo() {
    try {
      const chapter = await getChapter();
      state.currentChapter = chapter;
      const visualCount = chapter.questions.filter(q => hasVisual(q)).length;
      $("chapterInfo").textContent =
        `${chapter.questions.length} questions available • ${visualCount} visual question(s) • ${chapter.description || "Ready to practice."}`;
      const max = chapter.questions.length;
      [...$("questionCount").options].forEach(o => {
        if (o.value !== "all") o.disabled = Number(o.value) > max;
      });
      if (max < 10) $("questionCount").value = "all";
    } catch (e) {
      $("chapterInfo").textContent = "Chapter data could not be loaded.";
    }
  }

  function shuffle(array) {
    const a = [...array];
    for (let i=a.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function normalizeQuestion(raw) {
    // Legacy v1 compatibility.
    if (Array.isArray(raw.options) && raw.options.every(o => typeof o === "string")) {
      const answer = Number(raw.answer);
      const options = raw.options.map((text, index) => ({
        id: `opt${index + 1}`,
        text,
        visual: null,
        correct: index === answer
      }));
      return {
        ...raw,
        version: 1,
        questionVisual: raw.questionVisual || null,
        options,
        correctOptionId: options[answer]?.id || "",
        visualRequired: Boolean(raw.visualRequired)
      };
    }

    const options = Array.isArray(raw.options) ? raw.options.map((o, index) => ({
      id: String(o.id || `opt${index + 1}`),
      text: String(o.text ?? ""),
      visual: o.visual || null,
      correct: String(o.id || `opt${index + 1}`) === String(raw.correctOptionId)
    })) : [];

    return {
      ...raw,
      version: raw.version || 2,
      questionVisual: raw.questionVisual || null,
      options,
      correctOptionId: String(raw.correctOptionId || ""),
      visualRequired: Boolean(raw.visualRequired)
    };
  }

  function buildQuiz(questions, count) {
    let chosen = shuffle(questions);
    if (count !== "all") chosen = chosen.slice(0, Math.min(Number(count), chosen.length));
    return chosen.map(q => {
      const normalized = normalizeQuestion(q);
      return {
        ...normalized,
        options: shuffle(normalized.options)
      };
    });
  }

  function hasVisual(q) {
    return Boolean(q?.questionVisual?.svg || (q?.options || []).some(o => o.visual?.svg));
  }

  function renderSVG(container, visual) {
    if (!visual?.svg) return false;
    try {
      const svg = window.SVGGuard.sanitize(visual.svg);
      if (visual.alt) svg.setAttribute("aria-label", String(visual.alt));
      container.replaceChildren(svg);
      return true;
    } catch (error) {
      console.warn("Blocked invalid SVG:", error);
      return false;
    }
  }

  function renderQuestionVisual(q) {
    const wrap = $("questionVisual");
    wrap.replaceChildren();
    wrap.classList.add("hidden");
    if (q.questionVisual?.svg && renderSVG(wrap, q.questionVisual)) {
      wrap.classList.remove("hidden");
    }
  }

  async function startQuiz(useMistakes = false) {
    $("homeStatus").textContent = "";
    try {
      const chapter = await getChapter();
      let questions = chapter.questions;
      if (useMistakes) {
        const mistakes = storage.get("quizMistakes", []);
        const ids = new Set(mistakes.filter(x => x.chapterId === chapter.id).map(x => x.questionId));
        questions = questions.filter(q => ids.has(q.id));
        if (!questions.length) {
          $("homeStatus").textContent = "No saved mistakes for this chapter yet.";
          return;
        }
      }
      state.currentChapter = chapter;
      state.quiz = buildQuiz(questions, useMistakes ? "all" : $("questionCount").value);
      state.index = 0;
      state.answers = [];
      state.mode = $("quizMode").value;
      state.selectedBook = $("bookSelect").value;
      state.selectedChapter = $("chapterSelect").value;
      show("screenQuiz");
      renderQuestion();
    } catch (e) {
      $("homeStatus").textContent = e.message;
    }
  }

  function makeOptionContent(option, index) {
    const fragment = document.createDocumentFragment();

    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.textContent = `${String.fromCharCode(65 + index)}.`;
    letter.setAttribute("aria-hidden", "true");
    fragment.appendChild(letter);

    const body = document.createElement("span");
    body.className = "option-body";

    if (option.visual?.svg) {
      const visual = document.createElement("span");
      visual.className = "option-visual";
      if (renderSVG(visual, option.visual)) {
        body.appendChild(visual);
      }
    }

    if (option.text) {
      const text = document.createElement("span");
      text.className = "option-text";
      text.textContent = option.text;
      body.appendChild(text);
    }

    fragment.appendChild(body);
    return fragment;
  }

  function renderQuestion() {
    const q = state.quiz[state.index];
    const total = state.quiz.length;
    $("progressText").textContent = `Question ${state.index + 1} of ${total}`;
    $("progressBar").style.width = `${((state.index + 1)/total)*100}%`;
    const answered = state.answers.length ? state.answers.filter(a => a.correct).length : 0;
    $("scoreLive").textContent = `${state.answers.length ? Math.round(answered/state.answers.length*100) : 0}%`;
    $("difficultyBadge").textContent = q.difficulty || "Medium";
    $("topicText").textContent = q.topic || "";
    $("questionText").textContent = q.question;
    renderQuestionVisual(q);

    $("feedback").classList.add("hidden");
    $("feedback").replaceChildren();
    $("nextQuestion").classList.add("hidden");
    $("finishQuiz").classList.add("hidden");

    const options = $("options");
    options.innerHTML = "";
    q.options.forEach((option, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.setAttribute("aria-label", `${String.fromCharCode(65+i)}. ${option.text || "Visual answer"}`);
      btn.appendChild(makeOptionContent(option, i));
      btn.addEventListener("click", () => answerQuestion(i));
      options.appendChild(btn);
    });
  }

  function showFeedback(correct, q) {
    const feedback = $("feedback");
    const title = document.createElement("strong");
    title.textContent = correct ? "Correct!" : "Not quite.";
    feedback.replaceChildren(title);
    if (state.mode === "practice") {
      const p = document.createElement("span");
      p.textContent = q.explanation || "Review this question in the chapter.";
      feedback.appendChild(p);
    } else {
      const p = document.createElement("span");
      p.textContent = "Explanation will appear in the review.";
      feedback.appendChild(p);
    }
    feedback.classList.remove("hidden");
  }

  function answerQuestion(selectedIndex) {
    const q = state.quiz[state.index];
    const buttons = [...$("options").children];
    if (buttons.some(b => b.disabled)) return;

    const selected = q.options[selectedIndex];
    const correct = selected.id === q.correctOptionId;
    buttons.forEach((button, i) => {
      button.disabled = true;
      if (q.options[i].id === q.correctOptionId) button.classList.add("correct");
      if (i === selectedIndex && !correct) button.classList.add("wrong");
    });

    state.answers.push({
      questionId: q.id,
      correct,
      selectedOptionId: selected.id,
      selected: selected.text || "Visual answer",
      correctOptionId: q.correctOptionId,
      correctAnswer: q.options.find(o => o.id === q.correctOptionId)?.text || "Visual answer"
    });

    saveMistake(q, correct);
    showFeedback(correct, q);

    if (state.index === state.quiz.length - 1) {
      $("finishQuiz").classList.remove("hidden");
    } else {
      $("nextQuestion").classList.remove("hidden");
    }
    const score = state.answers.filter(a => a.correct).length;
    $("scoreLive").textContent = `${Math.round(score/state.answers.length*100)}%`;
  }

  function appendReviewVisual(parent, visual, alt) {
    if (!visual?.svg) return;
    try {
      const wrap = document.createElement("div");
      wrap.className = "review-visual";
      renderSVG(wrap, {...visual, alt: alt || visual.alt});
      parent.appendChild(wrap);
    } catch {}
  }

  function saveMistake(q, correct) {
    const existing = storage.get("quizMistakes", []);
    const key = `${state.currentChapter.id}:${q.id}`;
    const filtered = existing.filter(x => `${x.chapterId}:${x.questionId}` !== key);
    if (!correct) filtered.push({chapterId:state.currentChapter.id, questionId:q.id});
    storage.set("quizMistakes", filtered.slice(-500));
  }

  function nextQuestion() {
    if (state.index < state.quiz.length - 1) {
      state.index++;
      renderQuestion();
    }
  }

  function finishQuiz() {
    const correct = state.answers.filter(a => a.correct).length;
    const total = state.quiz.length;
    const percent = Math.round(correct/total*100);
    const attempts = storage.get("quizAttempts", 0) + 1;
    const bestKey = `best:${state.currentChapter.id}`;
    const best = Math.max(percent, storage.get(bestKey, 0));
    storage.set("quizAttempts", attempts);
    storage.set(bestKey, best);

    const history = storage.get("quizHistory", []);
    history.push({
      chapterId: state.currentChapter.id,
      chapterTitle: state.currentChapter.title,
      percent,
      correct,
      total,
      at: new Date().toISOString()
    });
    storage.set("quizHistory", history.slice(-100));

    $("resultPercent").textContent = `${percent}%`;
    $("resultCorrect").textContent = correct;
    $("resultWrong").textContent = total-correct;
    $("resultBest").textContent = `${best}%`;
    $("resultTitle").textContent = percent >= 80 ? "Excellent work!" : percent >= 60 ? "Good progress!" : "Keep practicing!";
    $("resultSummary").textContent = `You answered ${correct} of ${total} questions correctly.`;

    const list = $("reviewList");
    list.innerHTML = "";
    state.quiz.forEach((q, i) => {
      const a = state.answers[i];
      const item = document.createElement("article");
      item.className = `review-item ${a?.correct ? "correct" : "wrong"}`;

      const title = document.createElement("div");
      title.className = "review-question";
      title.textContent = `${i+1}. ${q.question}`;
      item.appendChild(title);

      if (q.questionVisual?.svg) appendReviewVisual(item, q.questionVisual);

      const selected = document.createElement("div");
      selected.className = "review-answer";
      selected.textContent = `Your answer: ${a?.selected || "Not answered"}`;
      item.appendChild(selected);

      const correctAnswer = q.options.find(o => o.id === q.correctOptionId);
      const correctText = document.createElement("div");
      correctText.className = "review-answer";
      correctText.textContent = `Correct answer: ${correctAnswer?.text || "Visual answer"}`;
      item.appendChild(correctText);

      if (correctAnswer?.visual?.svg) appendReviewVisual(item, correctAnswer.visual);

      const explanation = document.createElement("div");
      explanation.className = "review-answer";
      explanation.textContent = q.explanation || "";
      item.appendChild(explanation);

      list.appendChild(item);
    });
    updateStats();
    show("screenResults");
  }

  function updateStats() {
    const attempts = storage.get("quizAttempts", 0);
    const history = storage.get("quizHistory", []);
    const best = history.length ? Math.max(...history.map(x => x.percent)) : null;
    const mastered = history.length ? Math.round(history.filter(x => x.percent >= 80).length / history.length * 100) : 0;
    $("statAttempts").textContent = attempts;
    $("statBest").textContent = best === null ? "—" : `${best}%`;
    $("statMastered").textContent = `${mastered}%`;
  }

  function registerPWA() {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(console.warn);
  }

  $("bookSelect").addEventListener("change", populateChapters);
  $("chapterSelect").addEventListener("change", updateChapterInfo);
  $("startQuiz").addEventListener("click", () => startQuiz(false));
  $("mistakesQuiz").addEventListener("click", () => startQuiz(true));
  $("nextQuestion").addEventListener("click", nextQuestion);
  $("finishQuiz").addEventListener("click", finishQuiz);
  $("quitQuiz").addEventListener("click", () => show("screenHome"));
  $("retryQuiz").addEventListener("click", () => startQuiz(false));
  $("backHome").addEventListener("click", () => show("screenHome"));
  $("aboutButton").addEventListener("click", () => show("screenAbout"));
  $("aboutHome").addEventListener("click", () => show("screenHome"));
  $("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    storage.set("darkMode", document.body.classList.contains("dark"));
  });
  if (storage.get("darkMode", false)) document.body.classList.add("dark");

  init();
})();