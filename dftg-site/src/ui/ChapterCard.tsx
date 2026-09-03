import { AnimatePresence, motion } from 'motion/react';
import SplitText from '@react-bits/TextAnimations/SplitText/SplitText';
import BlurText from '@react-bits/TextAnimations/BlurText/BlurText';
import FadeContent from '@react-bits/Animations/FadeContent/FadeContent';
import SpotlightCard from '@react-bits/Components/SpotlightCard/SpotlightCard';
import { ucStage } from '@/ibd/conditions.ts';
import { CHAPTER_CONTENT } from '@/ibd/content.ts';
import { chapterAt, stateAt } from '@/ibd/timeline.ts';
import { useEffect, useRef } from 'react';
import { useSceneContext } from '@/scene/scene-context.ts';
import { player, usePlayer } from '@/store/player.ts';

export function ChapterCard() {
  const chapterId = usePlayer((s) => chapterAt(s.time).chapter.id);
  const reduced = usePlayer((s) => s.reducedMotion);
  const stage = usePlayer((s) => {
    const st = stateAt(s.time);
    return st.chapterId === 'uc' && st.uc > 0.05 ? ucStage(st.ucExtent)?.name ?? null : null;
  });
  const content = CHAPTER_CONTENT[chapterId];
  const { options } = useSceneContext();
  const plain = reduced || options.capture;
  const fadeRef = useRef<HTMLDivElement | null>(null);

  // In capture mode the fade is driven by the timeline clock so video frames are deterministic.
  useEffect(() => {
    if (!options.capture) return;
    return player.onFrame((s) => {
      const { localTime, chapter } = chapterAt(s.time);
      const o = Math.max(0, Math.min(1, localTime / 0.7, (chapter.duration - localTime) / 0.45));
      const el = fadeRef.current;
      if (el) {
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translateY(${((1 - o) * 10).toFixed(1)}px)`;
      }
    });
  }, [options.capture]);

  return (
    <div ref={fadeRef} data-avoid-labels className="pointer-events-auto w-full max-w-[26rem]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={chapterId}
          initial={{ opacity: 0, y: plain ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: plain ? 0 : -8 }}
          transition={{ duration: options.capture ? 0 : reduced ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <SpotlightCard className="glass !rounded-2xl !border-(--border) !bg-(--surface) p-4 sm:p-5" spotlightColor="rgba(53, 214, 185, 0.14)">
            <p className="eyebrow">{content.eyebrow}{stage ? ` · ${stage}` : ''}</p>
            {plain ? (
              <h2 className="font-display mt-1 text-2xl leading-tight font-medium sm:text-[1.75rem]">{content.title}</h2>
            ) : (
              <SplitText
                key={chapterId}
                text={content.title}
                tag="h2"
                className="font-display mt-1 text-2xl leading-tight font-medium sm:text-[1.75rem]"
                splitType="words"
                delay={55}
                duration={0.8}
                ease="power3.out"
                from={{ opacity: 0, y: 22 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.01}
                rootMargin="0px"
                textAlign="left"
              />
            )}
            {plain ? (
              <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-(--muted) sm:line-clamp-none sm:text-sm">{content.body}</p>
            ) : (
              <BlurText
                key={`${chapterId}-body`}
                text={content.body}
                className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-(--muted) sm:line-clamp-none sm:text-sm"
                animateBy="words"
                delay={18}
                stepDuration={0.3}
                threshold={0}
                rootMargin="0px"
              />
            )}
            <ul className="mt-3 hidden flex-wrap gap-1.5 sm:flex" aria-label="Key facts">
              {content.facts.map((fact, i) => {
                const chip = (
                  <li className="rounded-full border border-(--border) bg-(--surface-strong) px-2.5 py-1 text-[11px] font-medium text-(--text)">
                    {fact}
                  </li>
                );
                return plain ? (
                  <span key={`${chapterId}-${i}`} className="contents">{chip}</span>
                ) : (
                  <FadeContent key={`${chapterId}-${i}`} blur duration={500} delay={500 + i * 140} threshold={0.01} initialOpacity={0}>
                    {chip}
                  </FadeContent>
                );
              })}
            </ul>
          </SpotlightCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
