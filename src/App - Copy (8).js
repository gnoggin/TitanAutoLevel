import React, { useRef, useState, useEffect, useCallback } from 'react';
import Spline from '@splinetool/react-spline';

const SectionIndicators = ({ totalSections, currentSection, onSectionClick }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '30%',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '10px',
      zIndex: 10,
      padding: '10px',
    }}>
      {[...Array(totalSections)].map((_, index) => (
        <button
          key={index}
          onClick={() => onSectionClick(index)}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            border: '2px solid white',
            background: index === currentSection ? 'white' : 'transparent',
            cursor: 'pointer',
            padding: 0,
            transition: 'background-color 0.3s ease',
            boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)'
          }}
          aria-label={`Go to section ${index + 1}`}
        />
      ))}
    </div>
  );
};

function App() {
  const splineRef = useRef();
  const containerRef = useRef();
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const lastTouch = useRef({ x: 0, time: 0 });
  const velocity = useRef(0);
  const animationFrame = useRef(null);
  const [currentSection, setCurrentSection] = useState(0);
  const isScrolling = useRef(false);
  const scrollDirection = useRef(0);
  const scrollTimeout = useRef(null);

  const sections = [
    { title: "Section 1", content: "This is the content for section 1.", color: "#ff6b6b" },
    { title: "Section 2", content: "Here's some information for section 2.", color: "#4ecdc4" },
    { title: "Section 3", content: "Section 3 contains this text.", color: "#45b7d1" },
    { title: "Section 4", content: "Welcome to section 4.", color: "#feca57" },
    { title: "Section 5", content: "This is the final section.", color: "#ff9ff3" },
  ];

  const handleSplineEvent = useCallback((e) => {
    if (e.target.name.startsWith('button')) {
      const sectionIndex = parseInt(e.target.name.slice(-1)) - 1;
      if (sectionIndex >= 0 && sectionIndex < sections.length) {
        scrollToSection(sectionIndex);
      }
    }
  }, []);

  function onLoad(splineApp) {
    console.log('Spline scene loaded');
    splineRef.current = splineApp;
    splineApp.addEventListener('mouseDown', handleSplineEvent);
  }

  const updateSplineObject = useCallback((progress) => {
    if (splineRef.current) {
      const myObject = splineRef.current.findObjectByName('myObject');
      if (myObject) {
        myObject.rotation.y = progress * Math.PI * 2;
      }
    }
  }, []);

  const updateSplineSection = useCallback((sectionIndex) => {
    if (splineRef.current) {
      splineRef.current.setVariable('Section', sectionIndex + 1);
      console.log(`Updated Spline Section to: ${sectionIndex + 1}`);
    }
  }, []);

  const scrollToSection = useCallback((sectionIndex) => {
    const container = containerRef.current;
    if (container) {
      const targetScroll = sectionIndex * container.clientWidth;
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      updateSplineObject(sectionIndex / (sections.length - 1));
      updateSplineSection(sectionIndex);
      setCurrentSection(sectionIndex);
    }
  }, [updateSplineObject, updateSplineSection]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      const progress = maxScroll > 0 ? container.scrollLeft / maxScroll : 0;
      updateSplineObject(progress);
      const newSection = Math.round(progress * (sections.length - 1));
      if (newSection !== currentSection) {
        setCurrentSection(newSection);
        updateSplineSection(newSection);
      }
    }
  }, [currentSection, updateSplineObject, updateSplineSection]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (container && !isScrolling.current) {
      isScrolling.current = true;
      scrollDirection.current = e.deltaY > 0 ? 1 : -1;
      
      const currentSection = Math.round(container.scrollLeft / container.clientWidth);
      const targetSection = Math.max(0, Math.min(sections.length - 1, currentSection + scrollDirection.current));
      
      scrollToSection(targetSection);

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

      scrollTimeout.current = setTimeout(() => {
        isScrolling.current = false;
      }, 500);
    }
  }, [scrollToSection]);

  const handleTouchStart = (e) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
    scrollLeft.current = containerRef.current.scrollLeft;
    lastTouch.current = { x: startX.current, time: Date.now() };
    velocity.current = 0;
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const x = e.touches[0].clientX;
    const walk = (startX.current - x) * 1.5;
    containerRef.current.scrollLeft = scrollLeft.current + walk;
    
    const now = Date.now();
    const dt = now - lastTouch.current.time;
    const dx = x - lastTouch.current.x;
    velocity.current = dx / dt;
    
    lastTouch.current = { x, time: now };
    handleScroll();
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    const container = containerRef.current;
    const currentPosition = container.scrollLeft;
    const targetSection = Math.round(currentPosition / container.clientWidth);
    scrollToSection(targetSection);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('scroll', handleScroll);
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);

      if (splineRef.current) {
        splineRef.current.addEventListener('mouseDown', handleSplineEvent);
      }

      return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
        if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
        if (splineRef.current) {
          splineRef.current.removeEventListener('mouseDown', handleSplineEvent);
        }
      };
    }
  }, [handleWheel, handleScroll, handleSplineEvent]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', width: '100%', height: '70%', top: 0, left: 0 }}>
        <Spline
          scene="https://prod.spline.design/euHwhtcJDcfPQtGv/scene.splinecode"
          onLoad={onLoad}
        />
      </div>
      <SectionIndicators
        totalSections={sections.length}
        currentSection={currentSection}
        onSectionClick={scrollToSection}
      />
      <div 
        ref={containerRef} 
        style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: '30%', 
          overflowX: 'scroll', 
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {sections.map((section, index) => (
          <div
            key={index}
            style={{
              display: 'inline-flex',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ width: '4%', backgroundColor: index === 0 ? section.color : sections[index - 1].color }} />
            <div style={{
              flex: 1,
              padding: '20px',
              boxSizing: 'border-box',
              backgroundColor: section.color,
              color: 'white',
              textShadow: '1px 1px 2px black',
            }}>
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </div>
            <div style={{ width: '4%', backgroundColor: index === sections.length - 1 ? section.color : sections[index + 1].color }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;