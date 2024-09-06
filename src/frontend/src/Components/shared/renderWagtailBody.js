import parse from 'html-react-parser';

/* DBC22-2095
 * Solution to flickr gallery not embedding properly.  See
 * https://github.com/remarkablemark/html-react-parser/issues/98
 * https://jsfiddle.net/remarkablemark/3h8ejw9n/
 */
function replace(domNode) {
  if (domNode.type === 'script') {
    const script = document.createElement('script');
    script.src = domNode.attribs.src;
    document.head.appendChild(script);
  }
}

export default function renderCmsBody(body) {
  return parse(body, { replace })
}
