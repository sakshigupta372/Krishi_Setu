import './BackgroundAnimations.css';

function BackgroundAnimations() {
  return (
    <>
      {/* Sun Decoration */}
      <div className="sun-decoration"></div>

      {/* Soil/Ground Pattern */}
      <div className="soil-pattern"></div>

      {/* Grass Wind Effect */}
      <div className="grass-effect"></div>

      {/* Farm Elements Container */}
      <div className="farm-elements">
        {/* Water Droplets */}
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>
        <div className="water-drop"></div>

        {/* Floating Crops */}
        <div className="floating-crop">🌾</div>
        <div className="floating-crop">🌽</div>
        <div className="floating-crop">🍅</div>
        <div className="floating-crop">🥕</div>
        <div className="floating-crop">🌻</div>

        {/* Twinkling Stars */}
        <div className="twinkle"></div>
        <div className="twinkle"></div>
        <div className="twinkle"></div>
        <div className="twinkle"></div>

        {/* Growing Plants */}
        <div className="growing-plant">🌱</div>
        <div className="growing-plant">🌱</div>
        <div className="growing-plant">🌱</div>

        {/* Butterflies */}
        <div className="butterfly">🦋</div>
        <div className="butterfly">🦋</div>

        {/* Clouds */}
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
      </div>
    </>
  );
}

export default BackgroundAnimations;
