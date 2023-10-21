// React
import React from 'react';
import {useNavigate} from 'react-router-dom';

// Third party packages
import parse from 'html-react-parser';

// Components and functions
import FriendlyTime from '../FriendlyTime';

// Styling
import './BulletinsList.scss';

export default function Bulletins(props) {
  // State, props and context
  const { bulletins } = props;

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

            <div className="timestamp-container">
              <span>{bulletin.live_revision > 1 ? "Published" : "Last updated" }</span>
              <FriendlyTime date={bulletin.latest_revision_created_at} />
            </div>

            <div className='bulletins-li-body'>{parse(bulletin.body)}</div>
          </li>
        );
      })}
    </ul>
  );
}
