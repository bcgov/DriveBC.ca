import React from 'react';
import parse, { domToReact } from 'html-react-parser';
import { NavLink } from 'react-router-dom';

function replace(domNode) {
  /* DBC22-2095
   * Solution to flickr gallery not embedding properly.  See
   * https://github.com/remarkablemark/html-react-parser/issues/98
   * https://jsfiddle.net/remarkablemark/3h8ejw9n/
   */
  if (domNode.type === 'script') {
    const script = document.createElement('script');
    script.src = domNode.attribs.src;
    document.head.appendChild(script);
  }
  /* DBC22-3141
   * Part of implementing subpages for advisories and bulletins: links coming
   * from cms need to be converted to NavLinks so they participate properly in
   * the React lifecycel (i.e., they don't trigger a whole page load)
   */
  if (domNode.name === 'a') {
    return <NavLink to={domNode.attribs['href']}>
      { domToReact(domNode.children, { replace }) }
    </NavLink>
  }
}

export default function renderCmsBody(body) {
  return parse(body, { replace })
}
