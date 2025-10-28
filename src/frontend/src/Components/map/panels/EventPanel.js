// React
import React, { useEffect } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { useMediaQuery } from "@uidotdev/usehooks";
import Linkify from 'linkify-react';
import parse from "html-react-parser";

// Internal imports
import { getTypeDisplay, convertDirection } from '../../events/functions';
import EventTypeIcon from '../../events/EventTypeIcon';
import FriendlyTime from '../../shared/FriendlyTime';
import ShareURLButton from '../../shared/ShareURLButton';

// Function to get SVG icon based on event type
const getEventSVGIcon = (eventData) => {
  const { display_category, event_type, severity } = eventData;
  
  switch (display_category) {
    case "closures":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="22" rx="11" fill="#CE3E39"/>
          <rect x="1" y="1" width="22" height="22" rx="11" stroke="white" strokeWidth="2"/>
          <rect x="6" y="10.5" width="12" height="3" rx="1" fill="white"/>
        </svg>
      );
    
    case "majorEvents":
      return event_type === 'CONSTRUCTION' ? (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1.41421" y="12.7275" width="16" height="16" rx="3" transform="rotate(-45 1.41421 12.7275)" fill="white"/>
          <rect x="1.41421" y="12.7275" width="16" height="16" rx="3" transform="rotate(-45 1.41421 12.7275)" stroke="#CE3E39" strokeWidth="2"/>
          <path d="M8.22791 9.72754C8.49353 9.72754 8.72791 9.96191 8.72791 10.2275V10.7275H10.056L8.72791 13.3994V16.2275C8.72791 16.5088 8.49353 16.7275 8.22791 16.7275C7.94666 16.7275 7.72791 16.5088 7.72791 16.2275V10.2275C7.72791 9.96191 7.94666 9.72754 8.22791 9.72754ZM14.056 10.7275L12.6342 13.5713L12.556 13.7275H11.3842L12.806 10.8994L12.8842 10.7275H14.056ZM13.3842 13.7275L14.806 10.8994L14.8842 10.7275H16.056L14.6342 13.5713L14.556 13.7275H13.3842ZM10.8842 10.7275H12.056L10.6342 13.5713L10.556 13.7275H9.38416L10.806 10.8994L10.8842 10.7275ZM15.3842 13.7275L16.7279 11.0713V10.2275C16.7279 9.96191 16.9467 9.72754 17.2279 9.72754C17.4935 9.72754 17.7279 9.96191 17.7279 10.2275V16.2275C17.7279 16.5088 17.4935 16.7275 17.2279 16.7275C16.9467 16.7275 16.7279 16.5088 16.7279 16.2275V13.7275H15.3842Z" fill="#CE3E39"/>
        </svg>
      ) : (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1.41421" y="12.7275" width="16" height="16" rx="3" transform="rotate(-45 1.41421 12.7275)" fill="white"/>
          <rect x="1.41421" y="12.7275" width="16" height="16" rx="3" transform="rotate(-45 1.41421 12.7275)" stroke="#CE3E39" strokeWidth="2"/>
          <path d="M11.2279 7.13077C11.2279 6.35579 11.8995 5.72754 12.7279 5.72754C13.5563 5.72754 14.2279 6.35579 14.2279 7.13077V13.942C14.2279 14.717 13.5563 15.3452 12.7279 15.3452C11.8995 15.3452 11.2279 14.717 11.2279 13.942V7.13077Z" fill="#CE3E39"/>
          <path d="M14.2279 18.3243C14.2279 19.0993 13.5563 19.7275 12.7279 19.7275C11.8995 19.7275 11.2279 19.0993 11.2279 18.3243C11.2279 17.5493 11.8995 16.9211 12.7279 16.9211C13.5563 16.9211 14.2279 17.5493 14.2279 18.3243Z" fill="#CE3E39"/>
        </svg>
      );
    
    case "minorEvents":
      return event_type === 'CONSTRUCTION' ? (
        <svg width="27" height="24" viewBox="0 0 27 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.5 22C12.5186 22 11.652 21.5617 11.2402 20.8281L2.21582 4.74805C1.87539 4.14137 1.95249 3.50473 2.34278 2.97656C2.74422 2.43348 3.49654 2 4.47656 2L22.5234 2C23.5035 2 24.2558 2.43349 24.6572 2.97656C25.0475 3.50473 25.1246 4.14137 24.7842 4.74805L15.7598 20.8281C15.348 21.5617 14.4814 22 13.5 22Z" fill="white" stroke="#FCBA19" strokeWidth="2"/>
          <path d="M8.53125 5.09375C8.81348 5.09375 9.0625 5.34277 9.0625 5.625V6.15625H10.4736L9.0625 8.99512V12C9.0625 12.2988 8.81348 12.5312 8.53125 12.5312C8.23242 12.5312 8 12.2988 8 12V5.625C8 5.34277 8.23242 5.09375 8.53125 5.09375ZM14.7236 6.15625L13.2129 9.17773L13.1299 9.34375H11.8848L13.3955 6.33887L13.4785 6.15625H14.7236ZM14.0098 9.34375L15.5205 6.33887L15.6035 6.15625H16.8486L15.3379 9.17773L15.2549 9.34375H14.0098ZM11.3535 6.15625H12.5986L11.0879 9.17773L11.0049 9.34375H9.75977L11.2705 6.33887L11.3535 6.15625ZM16.1348 9.34375L17.5625 6.52148V5.625C17.5625 5.34277 17.7949 5.09375 18.0937 5.09375C18.376 5.09375 18.625 5.34277 18.625 5.625V12C18.625 12.2988 18.376 12.5312 18.0937 12.5312C17.7949 12.5312 17.5625 12.2988 17.5625 12V9.34375H16.1348Z" fill="#584215"/>
        </svg>
      ) : (
        <svg width="27" height="24" viewBox="0 0 27 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.5 22C12.5186 22 11.652 21.5617 11.2402 20.8281L2.21582 4.74805C1.87539 4.14137 1.95249 3.50473 2.34278 2.97656C2.74422 2.43348 3.49654 2 4.47656 2L22.5234 2C23.5035 2 24.2558 2.43349 24.6572 2.97656C25.0475 3.50473 25.1246 4.14137 24.7842 4.74805L15.7598 20.8281C15.348 21.5617 14.4814 22 13.5 22Z" fill="white" stroke="#FCBA19" strokeWidth="2"/>
          <path d="M12.041 7.375L12.7969 5.49414C12.8672 5.2832 13.0781 5.125 13.3066 5.125H13.6758C13.9043 5.125 14.1152 5.2832 14.2031 5.49414L14.9414 7.375H12.041ZM11.6016 8.5H15.3809L16.0488 10.1875H10.9336L11.6016 8.5ZM9.84375 13L10.4941 11.3125H16.4883L17.1562 13H17.4375C17.7363 13 18 13.2637 18 13.5625C18 13.8789 17.7363 14.125 17.4375 14.125H9.5625C9.24609 14.125 9 13.8789 9 13.5625C9 13.2637 9.24609 13 9.5625 13H9.84375Z" fill="#584215"/>
        </svg>
      );
    
    case "futureEvents":
      switch (severity) {
        case "CLOSURE":
          return (
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1.41421" y="12.7275" width="16" height="16" rx="3" transform="rotate(-45 1.41421 12.7275)" fill="white"/>
              <rect x="1.41421" y="12.7275" width="16" height="16" rx="3" transform="rotate(-45 1.41421 12.7275)" stroke="#CE3E39" strokeWidth="2"/>
              <path d="M10.4779 7.85254C10.7064 7.85254 10.8998 8.0459 10.8998 8.27441V8.97754H13.431V8.27441C13.431 8.0459 13.6068 7.85254 13.8529 7.85254C14.0814 7.85254 14.2748 8.0459 14.2748 8.27441V8.97754H14.9779C15.5931 8.97754 16.1029 9.4873 16.1029 10.1025V10.3838V11.2275H15.8217H15.2592H14.4154H9.07166V15.7275C9.07166 15.8857 9.1947 16.0088 9.35291 16.0088H13.2201C13.431 16.3428 13.7123 16.6416 14.0287 16.8525H9.35291C8.72009 16.8525 8.22791 16.3604 8.22791 15.7275V11.2275V10.3838V10.1025C8.22791 9.4873 8.72009 8.97754 9.35291 8.97754H10.056V8.27441C10.056 8.0459 10.2318 7.85254 10.4779 7.85254ZM13.2904 14.3213C13.2904 13.4248 13.765 12.5986 14.556 12.1416C15.3295 11.6846 16.2963 11.6846 17.0873 12.1416C17.8607 12.5986 18.3529 13.4248 18.3529 14.3213C18.3529 15.2354 17.8607 16.0615 17.0873 16.5186C16.2963 16.9756 15.3295 16.9756 14.556 16.5186C13.765 16.0615 13.2904 15.2354 13.2904 14.3213ZM17.2279 14.3213C17.2279 14.1807 17.0873 14.04 16.9467 14.04H14.6967C14.5385 14.04 14.4154 14.1807 14.4154 14.3213C14.4154 14.4795 14.5385 14.6025 14.6967 14.6025H16.9467C17.0873 14.6025 17.2279 14.4795 17.2279 14.3213Z" fill="#CE3E39"/>
            </svg>
          );
        case "MAJOR":
          return (
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1.41421" y="12.7275" width="16" height="16" rx="3" transform="rotate(-45 1.41421 12.7275)" fill="white"/>
              <rect x="1.41421" y="12.7275" width="16" height="16" rx="3" transform="rotate(-45 1.41421 12.7275)" stroke="#CE3E39" strokeWidth="2"/>
              <path d="M10.7279 7.47754C11.0599 7.47754 11.3529 7.77051 11.3529 8.10254V8.72754H13.8529V8.10254C13.8529 7.77051 14.1263 7.47754 14.4779 7.47754C14.8099 7.47754 15.1029 7.77051 15.1029 8.10254V8.72754H16.0404C16.5482 8.72754 16.9779 9.15723 16.9779 9.66504V10.6025H8.22791V9.66504C8.22791 9.15723 8.63806 8.72754 9.16541 8.72754H10.1029V8.10254C10.1029 7.77051 10.3763 7.47754 10.7279 7.47754ZM8.22791 11.2275H16.9779V16.54C16.9779 17.0674 16.5482 17.4775 16.0404 17.4775H9.16541C8.63806 17.4775 8.22791 17.0674 8.22791 16.54V11.2275ZM9.47791 12.79V13.415C9.47791 13.5908 9.61462 13.7275 9.79041 13.7275H10.4154C10.5717 13.7275 10.7279 13.5908 10.7279 13.415V12.79C10.7279 12.6338 10.5717 12.4775 10.4154 12.4775H9.79041C9.61462 12.4775 9.47791 12.6338 9.47791 12.79ZM11.9779 12.79V13.415C11.9779 13.5908 12.1146 13.7275 12.2904 13.7275H12.9154C13.0717 13.7275 13.2279 13.5908 13.2279 13.415V12.79C13.2279 12.6338 13.0717 12.4775 12.9154 12.4775H12.2904C12.1146 12.4775 11.9779 12.6338 11.9779 12.79ZM14.7904 12.4775C14.6146 12.4775 14.4779 12.6338 14.4779 12.79V13.415C14.4779 13.5908 14.6146 13.7275 14.7904 13.7275H15.4154C15.5717 13.7275 15.7279 13.5908 15.7279 13.415V12.79C15.7279 12.6338 15.5717 12.4775 15.4154 12.4775H14.7904ZM9.47791 15.29V15.915C9.47791 16.0908 9.61462 16.2275 9.79041 16.2275H10.4154C10.5717 16.2275 10.7279 16.0908 10.7279 15.915V15.29C10.7279 15.1338 10.5717 14.9775 10.4154 14.9775H9.79041C9.61462 14.9775 9.47791 15.1338 9.47791 15.29ZM12.2904 14.9775C12.1146 14.9775 11.9779 15.1338 11.9779 15.29V15.915C11.9779 16.0908 12.1146 16.2275 12.2904 16.2275H12.9154C13.0717 16.2275 13.2279 16.0908 13.2279 15.915V15.29C13.2279 15.1338 13.0717 14.9775 12.9154 14.9775H12.2904ZM14.4779 15.29V15.915C14.4779 16.0908 14.6146 16.2275 14.7904 16.2275H15.4154C15.5717 16.2275 15.7279 16.0908 15.7279 15.915V15.29C15.7279 15.1338 15.5717 14.9775 15.4154 14.9775H14.7904C14.6146 14.9775 14.4779 15.1338 14.4779 15.29Z" fill="#CE3E39"/>
            </svg>
          );
        default:
          return (
            <svg width="27" height="24" viewBox="0 0 27 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 22C12.5186 22 11.652 21.5617 11.2402 20.8281L2.21582 4.74805C1.87539 4.14137 1.95249 3.50473 2.34278 2.97656C2.74422 2.43348 3.49654 2 4.47656 2L22.5234 2C23.5035 2 24.2558 2.43349 24.6572 2.97656C25.0475 3.50473 25.1246 4.14137 24.7842 4.74805L15.7598 20.8281C15.348 21.5617 14.4814 22 13.5 22Z" fill="white" stroke="#FCBA19" strokeWidth="2"/>
              <path d="M11.5 4.25C11.832 4.25 12.125 4.54297 12.125 4.875V5.5H14.625V4.875C14.625 4.54297 14.8984 4.25 15.25 4.25C15.582 4.25 15.875 4.54297 15.875 4.875V5.5H16.8125C17.3203 5.5 17.75 5.92969 17.75 6.4375V7.375H9V6.4375C9 5.92969 9.41016 5.5 9.9375 5.5H10.875V4.875C10.875 4.54297 11.1484 4.25 11.5 4.25ZM9 8H17.75V13.3125C17.75 13.8398 17.3203 14.25 16.8125 14.25H9.9375C9.41016 14.25 9 13.8398 9 13.3125V8ZM10.25 9.5625V10.1875C10.25 10.3633 10.3867 10.5 10.5625 10.5H11.1875C11.3437 10.5 11.5 10.3633 11.5 10.1875V9.5625C11.5 9.40625 11.3437 9.25 11.1875 9.25H10.5625C10.3867 9.25 10.25 9.40625 10.25 9.5625ZM12.75 9.5625V10.1875C12.75 10.3633 12.8867 10.5 13.0625 10.5H13.6875C13.8437 10.5 14 10.3633 14 10.1875V9.5625C14 9.40625 13.8437 9.25 13.6875 9.25H13.0625C12.8867 9.25 12.75 9.40625 12.75 9.5625ZM15.5625 9.25C15.3867 9.25 15.25 9.40625 15.25 9.5625V10.1875C15.25 10.3633 15.3867 10.5 15.5625 10.5H16.1875C16.3437 10.5 16.5 10.3633 16.5 10.1875V9.5625C16.5 9.40625 16.3437 9.25 16.1875 9.25H15.5625ZM10.25 12.0625V12.6875C10.25 12.8633 10.3867 13 10.5625 13H11.1875C11.3437 13 11.5 12.8633 11.5 12.6875V12.0625C11.5 11.9062 11.3437 11.75 11.1875 11.75H10.5625C10.3867 11.75 10.25 11.9062 10.25 12.0625ZM13.0625 11.75C12.8867 11.75 12.75 11.9062 12.75 12.0625V12.6875C12.75 12.8633 12.8867 13 13.0625 13H13.6875C13.8437 13 14 12.8633 14 12.6875V12.0625C14 11.9062 13.8437 11.75 13.6875 11.75H13.0625ZM15.25 12.0625V12.6875C15.25 12.8633 15.3867 13 15.5625 13H16.1875C16.3437 13 16.5 12.8633 16.5 12.6875V12.0625C16.5 11.9062 16.3437 11.75 16.1875 11.75H15.5625C15.3867 11.75 15.25 11.9062 15.25 12.0625Z" fill="#584215"/>
            </svg>
          );
      }
    
    case "roadConditions":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="22" rx="3" fill="white"/>
          <rect x="1" y="1" width="22" height="22" rx="3" stroke="#FCBA19" strokeWidth="2"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M18.6921 12.7801L12.7801 18.6921C12.3421 19.1026 11.6579 19.1026 11.2199 18.6921L5.30792 12.7801C4.89736 12.3421 4.89736 11.6579 5.30792 11.2199L11.2199 5.30792C11.6579 4.89736 12.3421 4.89736 12.7801 5.30792L18.6921 11.2199C19.1026 11.6579 19.1026 12.3421 18.6921 12.7801ZM18.1768 12.3618L15.812 14.7266C15.6368 14.8908 15.3631 14.8908 15.1879 14.7266L12.8231 12.3618C12.6589 12.1866 12.6589 11.9129 12.8231 11.7377L15.1879 9.3729C15.3631 9.20867 15.6368 9.20867 15.812 9.3729L18.1768 11.7377C18.341 11.9129 18.341 12.1866 18.1768 12.3618ZM8.81198 14.7266L11.1768 12.3618C11.341 12.1866 11.341 11.9129 11.1768 11.7377L8.81198 9.3729C8.63681 9.20867 8.3631 9.20867 8.18793 9.3729L5.82312 11.7377C5.65889 11.9129 5.65889 12.1866 5.82312 12.3618L8.18793 14.7266C8.3631 14.8908 8.63681 14.8908 8.81198 14.7266Z" fill="#584215"/>
        </svg>
      );
    
    case "chainUps":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="22" rx="3" fill="white"/>
          <rect x="1" y="1" width="22" height="22" rx="3" stroke="#F6E24B" strokeWidth="2"/>
          <path d="M8.09375 7.75H11.5098C13.2285 7.75 14.625 9.14648 14.6035 10.8652C14.6035 12.3906 13.5078 13.6797 12.0254 13.9375H11.9824C11.5957 14.002 11.252 13.7441 11.1875 13.3789C11.123 12.9922 11.3809 12.6484 11.7461 12.584H11.7891C12.627 12.4336 13.25 11.7031 13.25 10.8652C13.25 9.91992 12.4551 9.125 11.5098 9.125H8.09375C7.14844 9.125 6.375 9.91992 6.375 10.8652C6.375 11.7031 6.97656 12.4336 7.81445 12.584H7.85742C8.22266 12.6484 8.48047 12.9922 8.41602 13.3789C8.35156 13.7441 8.00781 14.002 7.62109 13.9375H7.57812C6.0957 13.6797 5 12.3906 5 10.8652C5 9.14648 6.375 7.75 8.09375 7.75ZM15.6348 16H12.2188C10.5 16 9.125 14.625 9.125 12.9062C9.125 11.3809 10.2207 10.0918 11.7246 9.83398H11.7461C12.1328 9.76953 12.4766 10.0273 12.541 10.3926C12.6055 10.7793 12.3477 11.123 11.9824 11.1875H11.9395C11.1016 11.3379 10.5 12.0469 10.5 12.9062C10.5 13.8516 11.2734 14.625 12.2188 14.625H15.6348C16.6016 14.625 17.375 13.8516 17.375 12.9062C17.375 12.0469 16.752 11.3379 15.9141 11.1875H15.8711C15.5059 11.123 15.248 10.7793 15.3125 10.3926C15.377 10.0273 15.7207 9.76953 16.1074 9.83398H16.1504C17.6328 10.0918 18.75 11.3809 18.75 12.9062C18.75 14.625 17.3535 16 15.6348 16Z" fill="#2D2D2D"/>
        </svg>
      );
    
    default:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="22" rx="11" fill="#CE3E39"/>
          <rect x="1" y="1" width="22" height="22" rx="11" stroke="white" strokeWidth="2"/>
          <rect x="6" y="10.5" width="12" height="3" rx="1" fill="white"/>
        </svg>
      );
  }
};

// Styling
import './EventPanel.scss';

// Main component
export default function EventPanel(props) {
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  const { feature, showRouteObjs } = props;

  const [searchParams, setSearchParams] = useSearchParams();

  const eventData = feature.ol_uid ? feature.getProperties() : feature;
  const severity = eventData.severity.toLowerCase();

  // useEffect hooks
  useEffect(() => {
    const event = feature.getProperties();

    searchParams.set('type', 'event');
    searchParams.set('display_category', event.display_category);
    searchParams.set('id', event.id);
    setSearchParams(searchParams, { replace: true });
  }, [feature]);

  return (
    <div
      className={`popup popup--event ${eventData.display_category} ${severity}`} tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__name">
          {getEventSVGIcon(eventData)}
          <p className="name">{getTypeDisplay(eventData)}</p>
        </div>
        <ShareURLButton />
      </div>

      <div className="popup__content">
        <div className="popup__content__title">
          <p className="name">{eventData.highway_segment_names ? eventData.highway_segment_names : eventData.route_at}</p>
          <p className="direction">{convertDirection(eventData.direction)}</p>
        </div>

        <div className="popup__content__description">
          <p className="location">Location</p>

          <div className="popup__content__shadow-box">
            {eventData.location_description}
          </div>
        </div>

        <div className="popup__content__description">
          <p>Description</p>
          <div className="popup__content__shadow-box">
            <p><Linkify>{parse(eventData.optimized_description)}</Linkify></p>
          </div>
        </div>

        {eventData.closest_landmark &&
          <div className="popup__content__description">
            <p>Closest Landmark</p>

            <div className="popup__content__shadow-box">
              <p>{eventData.closest_landmark}</p>
            </div>
          </div>
        }

        {eventData.next_update &&
          <div className="popup__content__description next-update">
            <p>Next update</p>
            <div className="popup__content__shadow-box">
              <FriendlyTime date={eventData.next_update} isNextUpdate={true} timezone={eventData.timezone} />
            </div>
          </div>
        }

        <div className="popup__content__description last-update">
          <p>Last update</p>
          <div className="popup__content__shadow-box">
            <FriendlyTime date={eventData.last_updated} timezone={eventData.timezone} />
          </div>
        </div>

        { eventData.display_category === 'chainUps' &&
          <div className="popup__content__description">
            <p>Who does this impact?</p>
            <div className="popup__content__shadow-box">
              <a
                href="https://www2.gov.bc.ca//gov/content/transportation/driving-and-cycling/traveller-information/seasonal/winter-driving/commercial"
                rel="noreferrer"
                alt="BC chain-up requirements"
              >Chain-up requirements</a> apply to a Commercial Vehicles with a weight of 11,794 kg or greater.
            </div>
          </div>
        }
      </div>
    </div>
  );
}
