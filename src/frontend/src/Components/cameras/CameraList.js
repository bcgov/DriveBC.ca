import React, { useEffect, useState, useRef } from "react";
import { getWebcams } from "../data/webcams";

export default function CameraList({ cameras }) {
  const [webcams, setWebcams] = useState({});
  const groupedCameras = {};
  const fetched = useRef();

  useEffect(() => {
    if (fetched.current) return;

    async function getCameras() {
      const retrievedCameras = await getWebcams();
      retrievedCameras.forEach((camera) => {
        const highway = camera.properties.highway;
        if (groupedCameras[highway]) {
          groupedCameras[highway].push(camera);
        } else {
          groupedCameras[highway] = [camera];
        }
      });

      setWebcams(groupedCameras);
      fetched.current = true;
    }
    if (!webcams.length) {
      getCameras();
    }
  }, []);
  return (
    <div>
      <div>search bar goes here</div>
      {Object.entries(webcams).map(([highway, cameras]) => (
        <div key={highway}>
          <h2>{highway}</h2>
          <ul>
            {cameras.map((camera, id) => (
              <li key={id}>
                <img src={camera.properties.url} width="300" />
                {camera.properties.name},{camera.properties.caption}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
