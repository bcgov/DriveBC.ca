// React
import React from 'react';
import {useNavigate} from 'react-router-dom';

// Components and functions
import { stripRichText } from '../data/helper';
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
              <span>{bulletin.first_published_at != bulletin.last_published_at ? "Last updated" : "Published" }</span>
              <FriendlyTime date={bulletin.latest_revision_created_at} />
            </div>

            {bulletin.teaser &&
              <div className='bulletins-li-body'>{bulletin.teaser}</div>
            }

            {!bulletin.teaser &&
              <div className='bulletins-li-body'>{stripRichText(bulletin.body)}</div>
            }
          </li>
        );
      })}
    </ul>
  );
}
