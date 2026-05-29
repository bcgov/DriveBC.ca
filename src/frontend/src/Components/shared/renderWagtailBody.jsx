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

  /* DBC22-4645
   * Resize YouTube videos based on screen size while keeping aspect ratio
   */
  if (domNode.name === 'iframe') {
    const width = parseInt(domNode.attribs.width, 10);
    const height = parseInt(domNode.attribs.height, 10);

    if (width && height && !isNaN(width) && !isNaN(height)) {
      const aspectRatio = width / height;

      // Copy all original attributes
      const props = {...domNode.attribs};

      // Set the style object
      props.style = { aspectRatio: aspectRatio };

      // Return a React iframe element with all props
      return (
        <iframe {...props}>
          {domToReact(domNode.children, { replace })}
        </iframe>
      );
    }
  }

  /* DBC22-3141
   * Part of implementing subpages for advisories and bulletins: links coming
   * from cms need to be converted to NavLinks so they participate properly in
   * the React lifecycle (i.e., they don't trigger a whole page load)
   */
  if (domNode.name === 'a' && domNode.attribs['href'].includes('flickr')) {  // DBC22-4580 added check so only flickr links are converted
    /* DBC22-2719
     * failing to copy other attributes of the domNode broke flickr's embed
     */
    const spread = {};
    for (const key in domNode.attribs) {
      if (key === 'href') { continue; }
      spread[key] = domNode.attribs[key];
    }

    return (
      <NavLink {...spread} to={domNode.attribs['href']}>
        { domToReact(domNode.children, { replace }) }
      </NavLink>
    );
  }
}

export default function renderCmsBody(body) {
  return parse(body, { replace })
}
