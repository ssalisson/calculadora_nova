import { useState, useEffect, useRef, useCallback } from 'react'
import { COURSES } from './data/courses'
import { STUDENTS } from './data/students'

// ── Helpers ──────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function normaliza(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
}

function buscarAlunos(termo) {
  const t = normaliza(termo.trim())
  if (t.length < 3) return []
  const res = []
  for (let i = 0; i < STUDENTS.length; i++) {
    if (normaliza(STUDENTS[i][1]).includes(t)) {
      res.push(STUDENTS[i])
      if (res.length >= 8) break
    }
  }
  return res
}

// ── Proteção anti-cópia ───────────────────────────────
function useProtecao() {
  useEffect(() => {
    const noCtx  = e => e.preventDefault()
    const noKeys = e => {
      const k = e.key.toUpperCase()
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I','J','C','K'].includes(k)) ||
        (e.ctrlKey && ['U','S','A'].includes(k)) ||
        (e.ctrlKey && e.altKey && ['I','J'].includes(k))
      ) e.preventDefault()
    }
    document.addEventListener('contextmenu', noCtx)
    document.addEventListener('keydown', noKeys)
    return () => {
      document.removeEventListener('contextmenu', noCtx)
      document.removeEventListener('keydown', noKeys)
    }
  }, [])
}

// ── Componente Principal ─────────────────────────────
export default function App() {
  useProtecao()

  const [busca,    setBusca]    = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [aluno,    setAluno]    = useState(null)   // [pos, nome, ssa1]
  const [curso,    setCurso]    = useState('')
  const [resultado, setResultado] = useState(null)
  const inputRef     = useRef(null)
  const suggestoesRef = useRef(null)
  const helloRef      = useRef(null)
  const wrapRef       = useRef(null)

  // Auto-scroll: rolar até o final quando sugestões aparecem
  useEffect(() => {
    if (sugestoes.length > 0) {
      setTimeout(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
      }, 50)
    }
  }, [sugestoes])

  // Auto-scroll: rolar até o final quando aluno é selecionado
  useEffect(() => {
    if (aluno) {
      setTimeout(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
      }, 100)
    }
  }, [aluno])

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handler = e => {
      if (!e.target.closest('.autocomplete')) setSugestoes([])
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const handleBusca = useCallback((e) => {
    const val = e.target.value
    setBusca(val)
    setSugestoes(val.trim().length >= 3 ? buscarAlunos(val) : [])
  }, [])

  const selecionarAluno = useCallback((item) => {
    setAluno(item)
    setBusca(item[1])
    setSugestoes([])
    setCurso('')
    setResultado(null)
  }, [])

  const calcular = useCallback(() => {
    if (!aluno || !curso) return
    const { campus, cursoNome } = JSON.parse(curso)
    const corte  = COURSES[campus][cursoNome]
    const ssa1   = aluno[2]
    const notaMinima = ssa1 + (corte - ssa1) / 0.70
    const impossivel = notaMinima > 100
    setResultado({ campus, cursoNome, corte, notaMinima, impossivel })
  }, [aluno, curso])

  const reiniciar = useCallback(() => {
    setBusca('')
    setSugestoes([])
    setAluno(null)
    setCurso('')
    setResultado(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  return (
    <main className="wrap" ref={wrapRef}>
      {/* Logo */}
      <div className="logo-container">
        <img src="/logo.png" alt="Prof. Alisson Coutinho" className="main-logo" draggable="false" />
      </div>
      <div className="header-divider" />

      {/* Cabeçalho */}
      <header className="masthead">
        <h1>Quanto você precisa tirar no SSA-2?</h1>
        <p className="sub">Feito para quem já tem a nota do SSA-1 e quer saber a meta mínima para seguir no páreo.</p>
      </header>

      <section className="card">
        {/* STEP 1 – Nome */}
        {!resultado && (
          <div className="step">
            <label className="q" htmlFor="nome-input">
              <span className="qnum">1</span> Qual o seu nome?
            </label>
            <div className="autocomplete">
              <input
                ref={inputRef}
                id="nome-input"
                className="nome-input"
                type="text"
                placeholder="Digite seu nome completo..."
                autoComplete="off"
                value={busca}
                onChange={handleBusca}
              />
              {sugestoes.length > 0 && (
                <ul className="suggestions" ref={suggestoesRef}>
                  {sugestoes.map((s, i) => (
                    <li key={i} onClick={() => selecionarAluno(s)}>{s[1]}</li>
                  ))}
                </ul>
              )}
              {busca.trim().length >= 3 && sugestoes.length === 0 && !aluno && (
                <ul className="suggestions" ref={suggestoesRef}>
                  <li className="empty">Nenhum nome encontrado</li>
                </ul>
              )}
            </div>

            {/* STEP 2 – Dados + Curso (aparece após selecionar aluno) */}
            {aluno && (
              <div className="hello step" ref={helloRef}>
                <p className="hello-name">Olá, {aluno[1]}!</p>
                <div className="mini-stats">
                  <div className="mini-stat mini-stat--pos">
                    <span className="mini-label">Posição Geral</span>
                    <span className="mini-value">{aluno[0]}º</span>
                  </div>
                  <div className="mini-stat mini-stat--ssa1">
                    <span className="mini-label">SSA-1</span>
                    <span className="mini-value">{fmt(aluno[2])}</span>
                  </div>
                </div>

                <label className="q step-curso" htmlFor="curso-select">
                  <span className="qnum">2</span> Qual curso você deseja?
                </label>
                <select
                  id="curso-select"
                  className="curso-select"
                  value={curso}
                  onChange={e => setCurso(e.target.value)}
                >
                  <option value="" disabled>Escolha um curso...</option>
                  {Object.entries(COURSES).map(([campus, cursos]) => (
                    <optgroup key={campus} label={campus}>
                      {Object.keys(cursos).map(cursoNome => (
                        <option key={cursoNome} value={JSON.stringify({ campus, cursoNome })}>
                          {cursoNome}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <button
                  className="btn btn-primary"
                  onClick={calcular}
                  disabled={!curso}
                >
                  Calcular nota mínima
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 – Resultado */}
        {resultado && (
          <div className="step">
            <div className="result-header">
              <div>
                <div className="result-course">{resultado.cursoNome}</div>
                <div className="result-campus">{resultado.campus}</div>
              </div>
            </div>

            <div className="cutoff-line">
              <span>Nota de corte do curso</span>
              <strong>{fmt(resultado.corte)}</strong>
            </div>

            {resultado.impossivel ? (
              <div className="goal-panel impossible">
                <div className="goal-label">Nota mínima necessária no SSA-2</div>
                <div className="goal-value">Ops!</div>
                <div className="goal-sub">Nota impossível</div>
                <p className="impossible-note">
                  Mesmo tirando 100 no SSA-2 e no SSA-3, sua média não alcançaria
                  a nota de corte desse curso partindo do seu SSA-1 atual.
                  Considere avaliar outras opções.
                </p>
              </div>
            ) : (
              <div className="goal-panel ok">
                <div className="goal-label">Nota mínima necessária no SSA-2</div>
                <div className="goal-value">{fmt(resultado.notaMinima)}</div>
                <div className="goal-sub">mantendo a mesma nota no SSA-3</div>
                <div className="acertos-box">
                  Isso equivale a{' '}
                  <strong>{Math.round(resultado.notaMinima / 1.111)} acertos</strong>{' '}
                  na prova
                </div>
              </div>
            )}

            <div className="actions">
              <button className="btn btn-ghost" onClick={reiniciar}>↺ Refazer</button>
            </div>
          </div>
        )}
      </section>

      <p className="disclaimer">
        Estimativa simplificada com base nas notas de corte da última chamada.
        Não substitui o resultado oficial da UPE.
      </p>
    </main>
  )
}
