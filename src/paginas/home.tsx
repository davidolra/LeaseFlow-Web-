import React from "react";
import Vistas from "./Vistas";
import { Link } from "react-router-dom";


const Home: React.FC = () => { 
  return (
    <>
    <div className="main-content ">
      <div className="container pt-4"></div>

      <h1 className="text-white fw-bold display-5">
        Bienvenidos a Leaseflow
      </h1>
      <p className="lead">
        Arrendar es sencillo, directo y sin comisiones.
      </p>

      {/* INICIO BUSCADOR DESTACADO */}
      <section className="hero-search-section ">
        <p className="lead mb-3 text-center">
          Completa el buscador para encontrar tu inmueble ideal sin intermediarios.
        </p>
        <form className="row g-3 align-items-center justify-content-center">
          <div className="col-12 col-md-5">
            <input
              type="text"
              className="form-control"
              placeholder="Ubicación"
              aria-label="Ubicación"
            />
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" aria-label="Tipo de inmueble">
              <option value="">Tipo de inmueble</option>
              <option value="departamento">Departamento</option>
              <option value="casa">Casa</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" aria-label="Rango de precio">
              <option value="">Rango de precio</option>
              <option value="0-500">$0 - $500,000</option>
              <option value="501-1000">$501,000 - $100,000,000</option>
              <option value="1001-2000">$1,000,001 - $1,600,000</option>
            </select>
          </div>
          <div className="col-12 mt-3 d-grid">
            <button type="submit" className="btn btn-light">
              Buscar
            </button>
          </div>
        </form>
      </section>
      {/* TERMINO BUSCADOR DESTACADO */}

{/* --- TARJETA DESTACADA --- */}
<div className="container my-5 propiedad-destacada">
  <div className="card text-white bg-warning shadow-lg border-0">
    <div className="card-body">
      <h2 className="card-title fw-bold">Propiedad Destacada</h2>
      <p className="card-text">La mejor opción para tu próximo hogar, revisa esta propiedad exclusiva Quilicura.</p>
      <Link to="/login" className="btn btn-dark">Ver Más</Link>
    </div>
  </div>
</div>

      {/* SECCIÓN BENEFICIOS */}
      <section className="container my-5 text-center">
        <h3 className="mb-4 fw-bold">¿Por qué elegir Leaseflow?</h3>
        <div className="row justify-content-center">
          <div className="col-12 col-md-4 mb-4">
            <div className="p-3 border rounded shadow-sm h-100 d-flex flex-column align-items-center">
              <i className="bi bi-speedometer2 fs-1 text-success mb-3"></i>
              <h5>Arrendamiento rápido</h5>
              <p>Encuentra tu inmueble ideal en minutos, sin comisiones ni intermediarios.</p>
            </div>
          </div>
          <div className="col-12 col-md-4 mb-4">
            <div className="p-3 border rounded shadow-sm h-100 d-flex flex-column align-items-center">
              <i className="bi bi-shield-check fs-1 text-success mb-3"></i>
              <h5>Seguridad garantizada</h5>
              <p>Operaciones transparentes y seguras para que tengas tranquilidad.</p>
            </div>
          </div>
          <div className="col-12 col-md-4 mb-4">
            <div className="p-3 border rounded shadow-sm h-100 d-flex flex-column align-items-center">
              <i className="bi bi-people fs-1 text-success mb-3"></i>
              <h5>Contacto directo</h5>
              <p>Comunícate directamente con el propietario, sin intermediarios molestos.</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    {/* Contador de personas viendo */}
    <div className="text-center my-5">
     <Vistas />
    </div>

      {/* SECCIÓN DE COMENTARIOS / TARJETAS */}
      <section className="container my-5">
        <h3 className="mb-4 fw-bold text-center">Opiniones de nuestros usuarios</h3>
        <div className="row g-4">
          {[
            { name: "Ana G.", text: "Excelente experiencia, encontré mi departamento ideal muy rápido.", stars: "★★★★★" },
            { name: "Carlos M.", text: "Muy buena atención y proceso transparente, recomiendo Leaseflow.", stars: "★★★★☆" },
            { name: "Camilo R.", text: "El buscador es súper fácil de usar y los resultados son precisos.", stars: "★★★★★" },
            { name: "Jorge G.", text: "Muy recomendable, todo el proceso fue rápido y seguro.", stars: "★★★★☆" },
          ].map((opinion, idx) => (
            <div className="col-12 col-md-6 col-lg-3" key={idx}>
              <div className="card h-100 shadow-sm comentario-card">
                <div className="card-body">
                  <h5 className="card-title">{opinion.name}</h5>
                  <p className="card-text">{opinion.text}</p>
                  <p className="text-warning mb-0">{opinion.stars}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>

    

  );
};

export default Home;
