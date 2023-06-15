import React, { useEffect, useState, useRef } from "react";
import { getWebcams } from "../data/webcams";

export default function CameraList() {
  const [webcams, setWebcams] = useState({});
  const groupedCameras = {};

  useEffect(() => {

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
    }
    if (!webcams.length) {
      getCameras();
    }
    return () =>{
      //unmounting, so empty list object
      setWebcams({});
    }
  }, []);
  return (
    <div>
      <div>search bar goes here</div>
      {Object.entries(webcams).map(([highway, cameras]) => (
        <div key={highway}>
          <h2>Highway {highway}</h2>
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
