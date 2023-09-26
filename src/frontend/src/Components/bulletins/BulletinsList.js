// React
import React from 'react';
import {useNavigate} from 'react-router-dom';

// Third party packages
import parse from 'html-react-parser';

// Styling
import './BulletinsList.scss';

export default function Bulletins(props) {
  // State, props and context
  const { bulletins, showDescriptions } = props;

  // Navigation
  const navigate = useNavigate();

  function handleClick(bulletin) {
     navigate(`/bulletins/${bulletin.id}`);
  }

  // Rendering
  return (
    <ul className="bulletins-list">
      {!!bulletins && bulletins.map((bulletin, index) => {
        return (
          <li key={bulletin.id} onClick={() => handleClick(bulletin)}>
            <h5 className='bulletins-li-title'>{bulletin.title}</h5>
            {showDescriptions &&
              <div className='bulletins-li-description'>{parse(bulletin.description)}</div>
            }
          </li>
        );
      })}
    </ul>
  );
}
