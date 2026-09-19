import type { MDXComponents } from 'mdx/types';
import { MdxImage, MdxPullQuote, MdxNote } from '@/components/journal/mdx-elements';

/**
 * Global MDX element mapping. Journal posts are authored in plain Markdown
 * where possible; these overrides give them the site's typography and let a
 * post drop in a captioned image, a pull quote or an aside.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: (props) => <h2 className="mdx-h2" {...props} />,
    h3: (props) => <h3 className="mdx-h3" {...props} />,
    p: (props) => <p className="mdx-p" {...props} />,
    ul: (props) => <ul className="mdx-ul" {...props} />,
    ol: (props) => <ol className="mdx-ol" {...props} />,
    li: (props) => <li className="mdx-li" {...props} />,
    blockquote: (props) => <blockquote className="mdx-quote" {...props} />,
    hr: () => <hr className="mdx-rule" />,
    a: (props) => <a className="mdx-a" {...props} />,
    table: (props) => (
      <div className="mdx-table-wrap">
        <table className="mdx-table" {...props} />
      </div>
    ),
    Image: MdxImage,
    PullQuote: MdxPullQuote,
    Note: MdxNote,
    ...components,
  };
}
