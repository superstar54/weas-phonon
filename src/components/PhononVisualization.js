import React, { useState, useEffect, useRef } from 'react';
import * as weas from 'weas';

function PhononVisualization() {
  const [fileContent, setFileContent] = useState('');
  const [eigenvector, setEigenvector] = useState([[1, 0, 0], [0, 0, 1]]);
  const [nframes, setNframes] = useState(20);
  const [amplitude, setAmplitude] = useState(1);
  const viewerRef = useRef(null);
  const weasViewerRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(reader.result);
    };
    reader.readAsText(file);
  };

  const handleEigenvectorChange = (event) => {
    if (event.key === 'Enter') {
      const value = JSON.parse(event.target.value);
      setEigenvector(value);
    }
  };

  const handleNframesChange = (event) => {
    if (event.key === 'Enter') {
      setNframes(Number(event.target.value));
    }
  };

  const handleAmplitudeChange = (event) => {
    if (event.key === 'Enter') {
      setAmplitude(Number(event.target.value));
    }
  };

  const generatePhononTrajectory = (atoms, eigenvectors, amplitude, nframes) => {
    const trajectory = [];
    const times = Array.from({ length: nframes }, (_, i) => 2 * Math.PI * (i / nframes));
    times.forEach((t) => {
      const vectors = eigenvectors.map((vec) => vec.map((val) => val * amplitude * Math.sin(t)));
      const newAtoms = atoms.copy();
      for (let i = 0; i < newAtoms.positions.length; i++) {
        newAtoms.positions[i] = newAtoms.positions[i].map((pos, j) => pos + vectors[i][j] / 5);
      }
      newAtoms.newAttribute("movement", vectors);
      trajectory.push(newAtoms);
    });
    return trajectory;
  };

  useEffect(() => {
    if (fileContent) {
      const domElement = viewerRef.current;
      const atoms = weas.parseCIF(fileContent);
      const phononTrajectory = generatePhononTrajectory(atoms, eigenvector, amplitude, nframes);

      if (!weasViewerRef.current) {
        const editor = new weas.WEAS({ domElement });
        weasViewerRef.current = editor;
      }

      const editor = weasViewerRef.current;
      editor.clear();
      editor.avr.atoms = phononTrajectory;
      editor.avr.modelStyle = 1;
      editor.avr.atomScale = 0.1;
      editor.avr.tjs.updateCameraAndControls({ direction: [0, 1, 0] });
      editor.avr.VFManager.addSetting({ origins: "positions", vectors: "movement", color: "#ff0000", radius: 0.1 });
      editor.avr.drawModels();
      editor.avr.showVectorField = true;
      editor.render();
    }
  }, [fileContent, eigenvector, amplitude, nframes]);

  return (
    <div>
      <h1>Phonon Visualization</h1>
      <input type="file" onChange={handleFileUpload} />
      <input
        type="text"
        placeholder="Eigenvector"
        defaultValue='[[1, 0, 0], [0, 0, 1]]'
        onKeyDown={handleEigenvectorChange}
      />
      <input
        type="number"
        placeholder="Number of Frames"
        defaultValue={20}
        onKeyDown={handleNframesChange}
      />
      <input
        type="number"
        placeholder="Amplitude"
        defaultValue={1}
        onKeyDown={handleAmplitudeChange}
      />
      <div
        id="viewer"
        ref={viewerRef}
        style={{ position: 'relative', width: '600px', height: '400px' }}
      ></div>
    </div>
  );
}

export default PhononVisualization;
