import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { currentUser } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const features = [
  {
    title: '내 자료로 바로 시작',
    description: 'CSV로 정리한 단어를 올리면 별도 설정 없이 학습 세션이 준비됩니다.',
    accent: 'blue',
  },
  {
    title: '회상과 판단을 함께',
    description: '객관식 채점과 직접 입력하는 셀프체크가 섞여 기억을 꺼내보게 합니다.',
    accent: 'violet',
  },
  {
    title: '틀린 단어를 선명하게',
    description: '세션이 끝나면 점수와 오답, 전체 풀이 내역을 한 화면에서 확인합니다.',
    accent: 'mint',
  },
];

const steps = [
  ['01', 'CSV 업로드', 'word, pos, meanings 형식의 단어장을 불러옵니다.'],
  ['02', '퀴즈 풀이', '문맥 없이 뜻을 떠올리며 기억의 빈틈을 찾습니다.'],
  ['03', '즉시 리뷰', '틀린 문제를 확인하고 다음 학습을 준비합니다.'],
];

export default async function Home() {
  const user = await currentUser();
  const dashboardHref = user?.role === 'tutor' ? '/tutor' : '/tutee';
  const dashboardLabel = user?.role === 'tutor' ? '튜터 대시보드' : '학습자 대시보드';

  return (
    <div className="marketing-page">
      <header className="site-header">
        <Brand />
        <nav className="site-nav" aria-label="주요 메뉴">
          <a href="#features">기능</a>
          <a href="#how">이용 방법</a>
          {user ? (
            <>
              <span className="nav-account" aria-label={`로그인 계정 ${user.username}`}>
                @{user.username}
              </span>
              <Link className="nav-action" href={dashboardHref}>{dashboardLabel}</Link>
            </>
          ) : (
            <>
              <Link href="/auth">로그인</Link>
              <Link className="nav-action" href="/practice">학습 시작</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="hero" aria-label="VocaBox 소개">
          <div className="hero-copy">
            <h1>
              외운 단어를
              <br />
              <span>진짜 실력</span>으로.
            </h1>
            <p className="hero-description">
              VocaBox는 나만의 단어장을 짧고 집중되는 퀴즈로 바꿉니다.
              객관식으로 확인하고, 셀프체크로 직접 떠올리고, 오답으로 마무리하세요.
            </p>
            <div className="hero-actions">
              <Link className="button button--primary" href="/practice">
                내 단어장으로 시작
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button--secondary" href={user ? dashboardHref : '/auth'}>
                {user ? dashboardLabel : '로그인 / 회원가입'}
              </Link>
            </div>
            <Link className="hero-portal" href={user ? dashboardHref : '/auth?role=tutor&mode=register'}>
              {user ? `${user.username}님의 대시보드로 이동` : '튜터이신가요? 학습 관리 시작하기'} <span aria-hidden="true">→</span>
            </Link>
            <div className="hero-tags" aria-label="주요 기능">
              <span>CSV 가져오기</span>
              <span>혼합형 퀴즈</span>
              <span>즉시 결과 리뷰</span>
            </div>
          </div>

          <div className="quiz-preview" aria-hidden="true">
            <div className="preview-top">
              <div className="preview-window">
                <i />
                <i />
                <i />
              </div>
              <span>VocaBox Practice</span>
            </div>
            <div className="preview-progress">
              <span style={{ width: '48%' }} />
            </div>
            <div className="preview-meta">
              <span>4 / 10</span>
              <b>객관식</b>
            </div>
            <div className="preview-word">
              <small>다음 단어의 뜻은?</small>
              <strong>resilient</strong>
              <em>형용사</em>
            </div>
            <div className="preview-options">
              <span>일시적인</span>
              <span className="is-correct">회복력 있는 <b>✓</b></span>
              <span>모호한</span>
            </div>
            <div className="preview-result">
              <strong>정답이에요!</strong>
              <span>연속 정답 3개</span>
            </div>
          </div>
        </section>

        <section className="feature-section" id="features">
          <div className="section-heading">
            <h2>외우는 과정에 필요한 것만 담았습니다</h2>
          </div>
          <div className="feature-grid">
            {features.map(feature => (
              <article className="feature-card" key={feature.title}>
                <span className={`feature-icon feature-icon--${feature.accent}`} />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="workflow" id="how">
          <div className="workflow-copy">
            <h2>파일 하나면, 복습이 시작됩니다</h2>
            <p>
              이미 가진 단어장을 버리지 마세요. VocaBox가 학습 가능한 질문 세트로
              정리하고, 같은 단어의 여러 뜻도 이어서 확인하게 해드립니다.
            </p>
            <div className="steps">
              {steps.map(([number, title, description]) => (
                <div className="step" key={number}>
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="format-card">
            <p className="format-label">지원 CSV 형식</p>
            <pre>
              <code>{`word,pos,meanings
resilient,형용사,회복력 있는
run,동사,달리다;운영하다
novel,명사,소설`}</code>
            </pre>
            <p className="format-hint">뜻이 여러 개면 세미콜론으로 구분하세요.</p>
          </div>
        </section>

        <section className="final-cta">
          <h2>오늘 외울 단어를 VocaBox에 담아보세요.</h2>
          <Link className="button button--primary" href="/practice">
            무료로 학습 시작
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <Brand compact />
        <p>나만의 단어장을 기억에 남는 연습으로.</p>
      </footer>
    </div>
  );
}
