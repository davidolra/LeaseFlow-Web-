import React from "react";

const Nosotros: React.FC = () => {
  return (
    <>
      <h1 className="fw-bold display-5 mt-5" style={{ marginTop: "3rem" }}>
        Sobre Nosotros
      </h1>
      <div className="main-content">
        <div className="nosotros-container">
          <p className="lead">
            <strong>Leaseflow</strong> es una plataforma inmobiliaria que permite gestionar propiedades de manera sencilla, directa y sin
            comisiones.
          </p>
          <p>
            Nuestra mision es simplificar el arriendo inmobiliario conectando directamente a propietarios e interesados, sin intermediarios.
            En Leaseflow impulsamos una experiencia transparente, segura y eficiente, donde cada usuario puede gestionar su propiedad o
            encontrar su hogar con confianza y facilidad.
          </p>
        </div>
      </div>
    </>
  );
};

export default Nosotros;
