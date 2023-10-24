// React
import React from 'react';
import {useNavigate} from 'react-router-dom';

// Components and functions
import { stripRichText } from '../data/helper';
import FriendlyTime from '../FriendlyTime';

// Styling
import './AdvisoriesList.scss';

export default function Advisories(props) {
  // State, props and context
  const { advisories, showDescriptions } = props;

  // Navigation
  const navigate = useNavigate();

  function handleClick(advisory) {
     navigate(`/advisories/${advisory.id}`);
  }

  // Rendering
  return (
    <ul className="advisories-list">
      {!!advisories && advisories.map((advisory, index) => {
        return (
          <li key={advisory.id} onClick={() => handleClick(advisory)}>
            <h5 className='advisories-li-title'>{advisory.title}</h5>

            {showDescriptions &&
              <div>
                <div className="timestamp-container">
                  <span>{advisory.live_revision > 1 ? "Published" : "Last updated" }</span>
                  <FriendlyTime date={advisory.latest_revision_created_at} />
                </div>

                {advisory.teaser &&
                  <div className='advisories-li-body'>{advisory.teaser}</div>
                }

                {!advisory.teaser &&
                  <div className='advisories-li-body'>{stripRichText(advisory.body)}</div>
                }
              </div>
            }
          </li>
        );
      })}
    </ul>
  );
}
