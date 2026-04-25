import React, { useEffect } from 'react';
import styled from 'styled-components/macro';
import ContentContainer from '@/components/elements/ContentContainer';
import { CSSTransition } from 'react-transition-group';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';

export interface PageContentBlockProps {
    title?: string;
    className?: string;
    showFlashKey?: string;
    /**
     * Opt-in flag for pages with editor-style content (config editor, file
     * manager, console) that benefit from filling the viewport width instead
     * of hitting the 1200px ContentContainer cap. Adds a small horizontal
     * gutter so content doesn't slam into the sidebar.
     */
    wide?: boolean;
}

const WideContainer = styled.div`
    ${tw`w-full`};
    padding: 0 1.5rem;
    @media (max-width: 640px) {
        padding: 0 1rem;
    }
`;

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, showFlashKey, className, wide, children }) => {
    useEffect(() => {
        if (title) {
            document.title = title;
        }
    }, [title]);

    const Container: React.FC<{ children: React.ReactNode; className?: string }> = wide
        ? ({ children, className }) => (
              <WideContainer className={className} css={tw`my-4 sm:my-6`}>
                  {children}
              </WideContainer>
          )
        : ({ children, className }) => (
              <ContentContainer css={tw`my-4 sm:my-6 px-4 sm:px-6`} className={className}>
                  {children}
              </ContentContainer>
          );

    return (
        <CSSTransition timeout={150} classNames={'fade'} appear in>
            <>
                <Container className={className}>
                    {showFlashKey && <FlashMessageRender byKey={showFlashKey} css={tw`mb-4`} />}
                    {children}
                </Container>
                <ContentContainer css={tw`mb-6 mt-8`}>
                    <p
                        css={tw`text-center text-[10px] font-display lowercase`}
                        style={{
                            letterSpacing: '0.28em',
                            color: 'rgba(156, 163, 175, 0.35)',
                        }}
                    >
                        gynx.gg &mdash; host smarter. play harder.
                    </p>
                </ContentContainer>
            </>
        </CSSTransition>
    );
};

export default PageContentBlock;
