import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import Spline from '@splinetool/react-spline';

function App() {
  const spline = useRef();
  const sectionsRef = useRef([]);
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);
  const splineContainerRef = useRef(null);
  const [splineHeight, setSplineHeight] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);

  function onLoad(splineApp) {
    console.log('Spline scene loaded');
    spline.current = splineApp;
    setIsSplineLoaded(true);
  }

  function scrollToSection(index) {
    console.log(`Scrolling to section ${index}`);
    setCurrentSection(index);
  }

  useLayoutEffect(() => {
    if (splineContainerRef.current) {
      const height = splineContainerRef.current.offsetHeight;
      setSplineHeight(height);
    }
  }, []);

  useEffect(() => {
    if (isSplineLoaded && spline.current) {
      const handleSplineEvent = (e) => {
        console.log('Spline event triggered:', e.target.name);
        switch(e.target.name) {
          case 'mybut01':
            scrollToSection(1);
            break;
          case 'mybut02':
            scrollToSection(2);
            break;
          case 'mybut03':
            scrollToSection(3);
            break;
          case 'mybut04':
            scrollToSection(4);
            break;
          default:
            console.log('Unhandled button:', e.target.name);
            break;
        }
      };

      spline.current.addEventListener('mouseDown', handleSplineEvent);

      return () => {
        if (spline.current) {
          spline.current.removeEventListener('mouseDown', handleSplineEvent);
        }
      };
    }
  }, [isSplineLoaded]);

  // Disable scroll
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    document.body.style.overflow = 'hidden';
    document.addEventListener('wheel', preventDefault, { passive: false });
    document.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      document.body.style.overflow = 'visible';
      document.removeEventListener('wheel', preventDefault);
      document.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  const sectionHeight = `calc(100vh - ${splineHeight}px)`;

  return (
    <div className="App" style={{ height: '100vh', overflow: 'hidden' }}>
      <div ref={splineContainerRef} style={{ height: '50vh', position: 'sticky', top: 0, zIndex: 1 }}>
        <Spline
          scene="https://prod.spline.design/euHwhtcJDcfPQtGv/scene.splinecode"
          onLoad={onLoad}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div style={{ position: 'relative', height: sectionHeight, overflow: 'hidden' }}>
        {[1, 2, 3, 4].map((sectionNum) => (
          <section
            key={sectionNum}
            ref={(el) => (sectionsRef.current[sectionNum] = el)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              padding: '20px',
              backgroundColor: `hsl(${sectionNum * 60}, 70%, 80%)`,
              opacity: currentSection === sectionNum ? 1 : 0,
              transition: 'opacity 0.5s ease-out',
              overflow: 'auto'
            }}
          >
            <h2>Section {sectionNum}</h2>
            <p>This is the content for section {sectionNum}. Do they all change? Add more text or components here as needed.</p>
            <p>You can add multiple paragraphs or other React components within each section.</p>
          </section>
        ))}
      </div>
    </div>
  );
}

export default App;