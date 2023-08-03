// Styling
import "./EventCard.scss";

const datetime_format = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
};
const formatter = new Intl.DateTimeFormat("en-US", datetime_format);

export default function EventCard({event, icon}) {

  const last_update_time = new Date(event.last_updated);
  const last_update_time_formatted = formatter.format(last_update_time);

  // Rendering
  return (
    <div className={"event-card " + event.severity.toLowerCase()}>
      <div className="event-card__title">
        <div className="route">{event.route}</div>
        <div className="direction">{event.direction}</div>
      </div>
      <div className="event-card__details">
        <div className="type">
          <div className="header">Type</div>
          <div className="content"> {icon} {event.severity.toLowerCase()}</div>
        </div>
        <div className="description">
          <div className="header">Description</div>
          <div className="content">{event.description}</div>
        </div>
        <div className="last-update">
          <div className="header">Last Update</div>
          <div className="content">{last_update_time_formatted}</div>
        </div>
        <div className="map">
          <div className="header">Map</div>
          <div className="content">map</div>
        </div>
      </div>
    </div>
  )
}