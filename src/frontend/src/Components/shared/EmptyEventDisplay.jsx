// React
import React, { useContext, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { faHexagonExclamation } from '@fortawesome/pro-regular-svg-icons';
import parse from 'html-react-parser';

// local imports
import { EmergencyAlertContext } from "../../App";
import PollingComponent from "./PollingComponent";
import { get } from "../data/helper";
import { API_HOST } from '../../env';

// Styling


export default function EmptyEventDisplay(props) {
  const { chainUpsOnly } = props;

  /* Main rendering function */
  return (
    <div className="empty-event-display">
      <h2>{`No ${chainUpsOnly ? 'commercial vehicle chain-ups in effect' : 'delays to display'}`}</h2>
      <>
        <strong>Do you have a starting location and a destination entered?</strong>
        <p>
          {
            `Adding a route will narrow down the information for the whole site, including the delays list. There
          might not be any ${chainUpsOnly ? 'commercial vehicle chain-ups in effect' : 'delays'} between those two locations.`
          }
        </p>
      </>
      <strong>Have you entered search terms or applied filters (e.g. an area) to narrow down the list?</strong>
      <p>These also narrow down information on this page.</p>
      <ul>
        <li>Try checking your spelling, changing, or removing your search terms.</li>
        <li>Remove or adjust the area filter to see if any {chainUpsOnly ? 'commercial vehicle chain-ups are in effect' : 'delays are'} in other areas.</li>
      </ul>

      <strong>Have you hidden any of the layers using the list filter?</strong>
      <p>Try toggling the filters on and off so that more information can be displayed.</p>
    </div>
  );
}
