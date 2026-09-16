(function () {
  "use strict";

  // ---------- Elements ----------
  const nomeInput      = document.getElementById('nome-input');
  const suggestionsEl  = document.getElementById('suggestions');
  const stepNome       = document.getElementById('step-nome');
  const stepCurso      = document.getElementById('step-curso');
  const stepResultado  = document.getElementById('step-resultado');
  const alunoNomeEl    = document.getElementById('aluno-nome');
  const alunoPosEl     = document.getElementById('aluno-pos');
  const alunoSsa1El    = document.getElementById('aluno-ssa1');
  const cursoSelect    = document.getElementById('curso-select');
  const btnCalcular    = document.getElementById('btn-calcular');
  const resultBox      = document.getElementById('result-box');
  const btnReiniciar   = document.getElementById('btn-reiniciar');

  // ---------- State ----------
  let alunoSelecionado = null; // {pos, nome, ssa1}

  // ---------- Formatação ----------
  const fmt = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ---------- Montar select de cursos agrupado por campus ----------
  function montarCursos() {
    Object.keys(COURSES).forEach((campus) => {
      const group = document.createElement('optgroup');
      group.label = campus;
      Object.keys(COURSES[campus]).forEach((curso) => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify({ campus, curso });
        opt.textContent = curso;
        group.appendChild(opt);
      });
      cursoSelect.appendChild(group);
    });
  }
  montarCursos();

  // ---------- Autocomplete ----------
  function normaliza(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  function buscarAlunos(termo) {
    const t = normaliza(termo.trim());
    if (t.length < 3) return [];
    const resultados = [];
    for (let i = 0; i < STUDENTS.length; i++) {
      const nome = STUDENTS[i][1];
      if (normaliza(nome).includes(t)) {
        resultados.push(STUDENTS[i]);
        if (resultados.length >= 8) break;
      }
    }
    return resultados;
  }

  function renderSugestoes(lista) {
    suggestionsEl.innerHTML = '';
    if (lista.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Nenhum nome encontrado';
      suggestionsEl.appendChild(li);
      suggestionsEl.hidden = false;
      return;
    }
    lista.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item[1];
      li.addEventListener('click', () => selecionarAluno(item));
      suggestionsEl.appendChild(li);
    });
    suggestionsEl.hidden = false;
  }

  nomeInput.addEventListener('input', () => {
    const termo = nomeInput.value;
    if (termo.trim().length < 3) {
      suggestionsEl.hidden = true;
      return;
    }
    renderSugestoes(buscarAlunos(termo));
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete')) {
      suggestionsEl.hidden = true;
    }
  });

  function selecionarAluno(item) {
    const [pos, nome, ssa1] = item;
    alunoSelecionado = { pos, nome, ssa1 };
    nomeInput.value = nome;
    suggestionsEl.hidden = true;

    alunoNomeEl.textContent = nome;
    alunoPosEl.textContent = pos + 'º';
    alunoSsa1El.textContent = fmt(ssa1);

    stepCurso.classList.remove('step-hidden');
    btnCalcular.disabled = !cursoSelect.value;

    stepCurso.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ---------- Curso ----------
  cursoSelect.addEventListener('change', () => {
    btnCalcular.disabled = !cursoSelect.value;
  });

  // ---------- Cálculo ----------
  btnCalcular.addEventListener('click', () => {
    if (!alunoSelecionado || !cursoSelect.value) return;

    const { campus, curso } = JSON.parse(cursoSelect.value);
    const corte = COURSES[campus][curso];
    const ssa1 = alunoSelecionado.ssa1;

    // x = SSA1 + (Corte - SSA1) / 0.70
    const notaMinima = ssa1 + (corte - ssa1) / 0.70;
    const impossivel = notaMinima > 100;

    renderResultado({ campus, curso, corte, notaMinima, impossivel });

    stepNome.classList.add('step-hidden');
    stepCurso.classList.add('step-hidden');
    stepResultado.classList.remove('step-hidden');
    stepResultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  function renderResultado({ campus, curso, corte, notaMinima, impossivel }) {
    let html = `
      <div class="result-header">
        <div>
          <div class="result-course">${curso}</div>
          <div class="result-campus">${campus}</div>
        </div>
      </div>
      <div class="cutoff-line">
        <span>Nota de corte do curso</span>
        <strong>${fmt(corte)}</strong>
      </div>
    `;

    if (impossivel) {
      html += `
        <div class="goal-panel impossible">
          <div class="goal-label">Nota mínima necessária no SSA-2</div>
          <div class="goal-value">Ops!</div>
          <div class="goal-sub">Nota impossível</div>
          <p class="impossible-note">
            Mesmo tirando 100 no SSA-2 e no SSA-3, sua média não alcançaria a nota de corte
            desse curso partindo do seu SSA-1 atual. Considere avaliar outras opções de curso
            ou campus.
          </p>
        </div>
      `;
    } else {
      const acertos = Math.round(notaMinima / 1.111);
      html += `
        <div class="goal-panel ok">
          <div class="goal-label">Nota mínima necessária no SSA-2</div>
          <div class="goal-value">${fmt(notaMinima)}</div>
          <div class="goal-sub">mantendo a mesma nota no SSA-3</div>
          <div class="acertos-box">
            Isso equivale a <strong>${acertos} acertos</strong> na prova
          </div>
        </div>
      `;
    }

    resultBox.innerHTML = html;
  }

  // ---------- Reiniciar ----------
  btnReiniciar.addEventListener('click', () => {
    alunoSelecionado = null;
    nomeInput.value = '';
    cursoSelect.value = '';
    btnCalcular.disabled = true;
    suggestionsEl.hidden = true;

    stepResultado.classList.add('step-hidden');
    stepCurso.classList.add('step-hidden');
    stepNome.classList.remove('step-hidden');
    nomeInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

})();
