'use client';

import type { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownCodeProps extends ComponentPropsWithoutRef<'code'> {
    inline?: boolean;
}

export function MarkdownContent({ content }: { content: string }) {
    return (
        <div className="prose prose-invert prose-blue max-w-none prose-headings:font-bold prose-a:text-blue-400 prose-pre:bg-transparent prose-pre:p-0 prose-code:text-purple-300 prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-strong:text-zinc-200">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ inline, className, children, ...props }: MarkdownCodeProps) {
                        const match = /language-(\w+)/.exec(className || '');
                        if (inline || !match) {
                            return <code className={className} {...props}>{children}</code>;
                        }
                        return (
                            <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-lg border border-white/10 text-sm"
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
