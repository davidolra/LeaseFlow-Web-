import React, { useState, useEffect } from "react";
import "./Vistas.css"; // crea un CSS para animaciones

const Vistas: React.FC = () => {
  const [personas, setPersonas] = useState(200);

  useEffect(() => {
    const interval = setInterval(() => {
      setPersonas(prev => prev + Math.floor(Math.random() * 5 + 1)); // aumenta 1-5 personas al azar
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="vistas-counter">
      <span className="number">{personas.toLocaleString()}</span> personas están viendo esto ahora
    </div>
  );
};

export default Vistas;
