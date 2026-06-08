'use client';

import { useActionState, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { SavedList } from '@/lib/models';
import type { WordItem } from '@/components/practice/types';
import { importVocabularyCsv, POS_CODE_HINTS } from '@/components/practice/preparation';
import { deleteListAction, saveListAction, toggleListArchiveAction } from '@/app/actions/tutor';
import { Archive, BookOpen, Edit2, Plus, Trash2, Upload, X } from '@/components/AppIcons';
import { SubmitButton } from '@/components/SubmitButton';

export function ListComposer({ lists }: { lists: SavedList[] }) {
  const [state, action, pending] = useActionState(saveListAction, {});
  const [listId, setListId] = useState('');
  const [title, setTitle] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [entries, setEntries] = useState<WordItem[]>([]);
  const [error, setError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewList, setViewList] = useState<SavedList | null>(null);
  const [parsing, setParsing] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (state.message) setSheetOpen(false);
  }, [state.message]);

  const openNew = () => {
    setListId('');
    setTitle('');
    setCsvFileName('');
    setEntries([]);
    setError('');
    setSheetOpen(true);
  };

  const edit = (list: SavedList) => {
    setListId(list.id);
    setTitle(list.title);
    setCsvFileName('');
    setEntries(list.entries);
    setError('');
    setSheetOpen(true);
  };

  const uploadCsv = (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type && file.type !== 'text/csv') {
      setError('CSV 파일만 업로드할 수 있습니다.');
      return;
    }
    setParsing(true);
    const reader = new FileReader();
    reader.onload = () => {
      setParsing(false);
      const text = typeof reader.result === 'string' ? reader.result : '';
      setCsvFileName(file.name);
      const parsed = importVocabularyCsv(text);
      if (parsed.status === 'error') { setError(parsed.error); setEntries([]); }
      else { setEntries(parsed.items); setError(''); }
    };
    reader.onerror = () => { setParsing(false); setError('CSV 파일을 읽지 못했습니다.'); };
    reader.readAsText(file);
  };

  return (
    <>
      <section className="vocab-list-library">
        <div className="vocab-list-library-header">
          <h2>단어장</h2>
          <span className="vocab-list-count">{lists.length}개</span>
          <button type="button" className="vocab-add-btn" onClick={openNew}>
            <Plus />새 단어장
          </button>
        </div>
        {lists.length === 0 && (
          <div className="vocab-empty">단어장이 없습니다. 새 단어장을 추가하세요.</div>
        )}
        {lists.map(list => (
          <div key={list.id} className={`vocab-list-card${list.archived ? ' is-archived' : ''}`}>
            <div className="vocab-list-card-icon" aria-hidden="true"><BookOpen /></div>
            <button type="button" className="vocab-list-card-main" onClick={() => setViewList(list)}>
              <strong>{list.title}</strong>
              <small>{list.entries.length}개 단어{list.archived ? ' · 보관됨' : ''}</small>
            </button>
            <div className="vocab-list-card-actions">
              <button type="button" className="vocab-icon-btn" aria-label="편집" title="편집" onClick={() => edit(list)}>
                <Edit2 />
              </button>
              <form action={toggleListArchiveAction}>
                <input name="listId" type="hidden" value={list.id} />
                <input name="restore" type="hidden" value={list.archived ? '1' : '0'} />
                <SubmitButton className="vocab-icon-btn" aria-label={list.archived ? '복원' : '보관'} title={list.archived ? '복원' : '보관'}>
                  <Archive />
                </SubmitButton>
              </form>
              <form action={deleteListAction} onSubmit={event => { if (!window.confirm('이 단어장을 삭제할까요? 기존 과제 기록은 유지됩니다.')) event.preventDefault(); }}>
                <input name="listId" type="hidden" value={list.id} />
                <SubmitButton className="vocab-icon-btn vocab-icon-btn--danger" aria-label="삭제" title="삭제">
                  <Trash2 />
                </SubmitButton>
              </form>
            </div>
          </div>
        ))}
      </section>

      {mounted && createPortal(
        <AnimatePresence>
          {/* View-only sheet */}
          {viewList && (
            <div key="view" className="bottom-sheet-layer" role="dialog" aria-modal="true" aria-label="단어 목록">
              <motion.button
                className="bottom-sheet-backdrop"
                type="button"
                onClick={() => setViewList(null)}
                aria-label="닫기"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                className="bottom-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 280, mass: 0.9 }}
              >
                <div className="bottom-sheet-grabber" aria-hidden="true" />
                <div className="csv-editor-header">
                  <div>
                    <h3>{viewList.title}</h3>
                    <span>{viewList.entries.length}개</span>
                  </div>
                  <button className="csv-editor-close" type="button" onClick={() => setViewList(null)} aria-label="닫기">
                    <X />
                  </button>
                </div>
                <div className="csv-editor-scroll">
                  <div className="csv-editor-table-wrap vocab-sheet-table">
                    <table className="csv-editor-table vocab-view-table">
                      <thead>
                        <tr>
                          <th scope="col">단어</th>
                          <th scope="col">품사</th>
                          <th scope="col">뜻</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewList.entries.map((entry, index) => (
                          <tr key={index}>
                            <td><span className="vocab-view-cell">{entry.word}</span></td>
                            <td><span className="vocab-view-cell vocab-view-cell--pos">{entry.pos}</span></td>
                            <td><span className="vocab-view-cell vocab-view-cell--meanings">{entry.meanings.join(', ')}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Edit sheet */}
          {sheetOpen && (
            <div key="edit" className="bottom-sheet-layer" role="dialog" aria-modal="true" aria-label={listId ? '단어장 편집' : '새 단어장'}>
              <motion.button
                className="bottom-sheet-backdrop"
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="닫기"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                className="bottom-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 280, mass: 0.9 }}
              >
                <div className="bottom-sheet-grabber" aria-hidden="true" />
                <div className="csv-editor-header">
                  <div>
                    <h3>{listId ? '단어장 편집' : '새 단어장'}</h3>
                    {entries.length > 0 && <span>{entries.length}개</span>}
                  </div>
                  <button className="csv-editor-close" type="button" onClick={() => setSheetOpen(false)} aria-label="닫기">
                    <X />
                  </button>
                </div>
                <form action={action} className="vocab-sheet-form">
                  <input name="listId" type="hidden" value={listId} />
                  <input name="entries" type="hidden" value={JSON.stringify(entries)} />
                  <div className="vocab-sheet-scroll">
                    <input
                      className="vocab-sheet-title-input"
                      name="title"
                      value={title}
                      onChange={event => setTitle(event.target.value)}
                      placeholder="단어장 제목"
                      maxLength={100}
                      required
                    />
                    <label className={`csv-upload-target vocab-upload-target${parsing ? ' is-parsing' : ''}`}>
                      <input accept=".csv,text/csv" type="file" disabled={parsing} onChange={event => uploadCsv(event.target.files?.[0])} />
                      <Upload />
                      <span>{parsing ? '파일 분석 중...' : csvFileName || 'CSV 파일 업로드'}</span>
                      <small>{parsing ? '' : entries.length ? `${entries.length}개 단어 검토됨` : `word,pos,meanings · ${POS_CODE_HINTS.slice(0, 3).map(({ code, label }) => `${code}=${label}`).join(', ')}`}</small>
                    </label>
                    {(error || state.error) && <p className="form-error">{error || state.error}</p>}
                    {entries.length > 0 && (
                      <div className="csv-editor-table-wrap vocab-sheet-table">
                        <table className="csv-editor-table">
                          <thead>
                            <tr>
                              <th scope="col">단어</th>
                              <th scope="col">품사</th>
                              <th scope="col">뜻 (;로 구분)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entries.map((entry, index) => (
                              <tr key={index}>
                                <td>
                                  <input
                                    maxLength={120}
                                    value={entry.word}
                                    onChange={event => setEntries(current => current.map((item, i) => i === index ? { ...item, word: event.target.value } : item))}
                                    aria-label={`단어 ${index + 1}`}
                                  />
                                </td>
                                <td>
                                  <input
                                    maxLength={40}
                                    value={entry.pos}
                                    onChange={event => setEntries(current => current.map((item, i) => i === index ? { ...item, pos: event.target.value } : item))}
                                    aria-label={`품사 ${index + 1}`}
                                  />
                                </td>
                                <td>
                                  <input
                                    value={entry.meanings.join(';')}
                                    onChange={event => setEntries(current => current.map((item, i) => i === index ? { ...item, meanings: event.target.value.split(';').map(v => v.trim()).filter(Boolean) } : item))}
                                    aria-label={`뜻 ${index + 1}`}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <div className="csv-editor-footer">
                    <button className="cta primary-action" disabled={pending || !entries.length} type="submit">
                      {listId ? '변경 저장' : '단어장 저장'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
