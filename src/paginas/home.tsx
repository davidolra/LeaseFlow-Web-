import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Vistas from "./Vistas";
import { Link, useNavigate } from "react-router-dom";
import { propiedadService, tipoService } from "../api";
import type { PropiedadDTO, TipoPropiedadDTO } from "../types";


const Home: React.FC = () => { 
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const featuredCtaTo = isLoggedIn ? "/arrienda" : "/login";

  const [tipos, setTipos] = useState<TipoPropiedadDTO[]>([]);
  const [featuredProps, setFeaturedProps] = useState<PropiedadDTO[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);

  const [q, setQ] = useState("");
  const [tipoId, setTipoId] = useState<number | "">("");
  const [precioRange, setPrecioRange] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [tiposData] = await Promise.all([tipoService.listar()]);
        if (!cancelled) setTipos(tiposData);
      } catch {
        if (!cancelled) setTipos([]);
      }

      try {
        setFeaturedLoading(true);
        const props = await propiedadService.listar(true);
        if (!cancelled) setFeaturedProps(Array.isArray(props) ? props : []);
      } catch {
        if (!cancelled) setFeaturedProps([]);
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = useMemo(() => {
    return featuredProps.slice(0, 6).map((p) => ({
      id: p.id,
      titulo: p.titulo,
      descripcion: p.descripcion || "Propiedad disponible para arriendo.",
      comuna: p.comuna?.nombre || p.direccion,
    }));
  }, [featuredProps]);

  const featuredLoop = useMemo(() => [...featured, ...featured], [featured]);

  const opinions = useMemo(
    () => [
      { name: "Ana G.", text: "Excelente experiencia, encontré mi departamento ideal muy rápido.", stars: "★★★★★" },
      { name: "Carlos M.", text: "Muy buena atención y proceso transparente, recomiendo Leaseflow.", stars: "★★★★☆" },
      { name: "Camilo R.", text: "El buscador es súper fácil de usar y los resultados son precisos.", stars: "★★★★★" },
      { name: "Jorge G.", text: "Muy recomendable, todo el proceso fue rápido y seguro.", stars: "★★★★☆" },
    ],
    [],
  );

  const benefits = useMemo(
    () => [
      {
        title: "Arrendamiento rápido",
        text: "Encuentra tu inmueble ideal en minutos, sin comisiones ni intermediarios.",
      },
      {
        title: "Seguridad garantizada",
        text: "Operaciones transparentes y seguras para que tengas tranquilidad.",
      },
      {
        title: "Contacto directo",
        text: "Comunícate directamente con el propietario, sin intermediarios.",
      },
    ],
    [],
  );

  const [opinionIndex, setOpinionIndex] = useState(0);
  const [benefitIndex, setBenefitIndex] = useState(0);
  const featuredScrollRef = useRef<HTMLDivElement | null>(null);
  const rightStackRef = useRef<HTMLDivElement | null>(null);
  const [rightStackHeight, setRightStackHeight] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setOpinionIndex((i) => (i + 1) % opinions.length);
    }, 3500);
    return () => window.clearInterval(id);
  }, [opinions.length]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setBenefitIndex((i) => (i + 1) % benefits.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [benefits.length]);

  const currentOpinion = opinions[opinionIndex];
  const currentBenefit = benefits[benefitIndex];

  useEffect(() => {
    const el = featuredScrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const half = el.scrollHeight / 2;
      if (el.scrollTop >= half - el.clientHeight - 2) {
        el.scrollTop = 0;
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    const el = rightStackRef.current;
    if (!el) return;

    let raf = 0;

    const measure = () => {
      const next = Math.round(el.getBoundingClientRect().height);
      setRightStackHeight((prev) => {
        if (prev === null) return next;
        if (prev === next) return prev;
        if (Math.abs(prev - next) <= 1) return prev;
        return next;
      });
    };

    const schedule = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(measure);
    };

    schedule();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => schedule());
      ro.observe(el);
      return () => {
        ro.disconnect();
        if (raf) window.cancelAnimationFrame(raf);
      };
    }

    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("resize", schedule);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="container">
        <div className="lf-hero lf-surface-card">
          <h1 className="fw-bold display-5 mb-2">Bienvenidos a Leaseflow</h1>
          <p className="lead mb-0">Arrendar es sencillo, directo y sin comisiones.</p>
        </div>

      <div className="lf-home-split mt-4">
        <div className="lf-surface-card lf-featured-panel" style={rightStackHeight ? { height: rightStackHeight } : undefined}>
          <div className="lf-panel-body">
            <div className="d-flex justify-content-between align-items-center">
              <div className="lf-panel-kicker">Propiedades destacadas</div>
            </div>
            <div className="lf-featured-scroll mt-3" ref={featuredScrollRef}>
              {featuredLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status" />
                </div>
              ) : featuredLoop.length === 0 ? (
                <div className="alert alert-secondary mb-0">
                  No hay propiedades destacadas disponibles.
                </div>
              ) : (
                featuredLoop.map((p, idx) => (
                  <div className="lf-featured-item" key={`${p.titulo}-${idx}`}>
                    <div className="lf-featured-content">
                      <div className="lf-featured-title">{p.titulo}</div>
                      <div className="lf-featured-meta">{p.comuna}</div>
                      <div className="lf-featured-text">{p.descripcion}</div>
                      <div className="mt-2 d-grid">
                        <Link to={featuredCtaTo} className="btn btn-primary btn-sm">
                          Ver Más
                        </Link>
                      </div>
                    </div>
                    <div className="lf-featured-media" aria-hidden="true"></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lf-right-stack" ref={rightStackRef}>
          <div className="lf-surface-card lf-right-card lf-right-top">
            <div className="lf-panel-body">
              <div className="lf-panel-kicker">Buscador</div>
              <div className="lf-panel-title">Encuentra tu inmueble</div>
              <div className="lf-panel-text">Completa el buscador para encontrar tu inmueble ideal.</div>
              <form
                className="d-grid gap-2 mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const params = new URLSearchParams();
                  if (q.trim()) params.set("q", q.trim());
                  if (tipoId !== "") params.set("tipoId", String(tipoId));
                  if (precioRange) {
                    const [min, max] = precioRange.split("-").map((x) => x.trim());
                    if (min) params.set("minPrecio", min);
                    if (max) params.set("maxPrecio", max);
                  }
                  navigate(`/arrienda${params.toString() ? `?${params.toString()}` : ""}`);
                }}
              >
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ubicación o palabra clave"
                  aria-label="Ubicación o palabra clave"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <select
                  className="form-select"
                  aria-label="Tipo de inmueble"
                  value={tipoId}
                  onChange={(e) => setTipoId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Tipo de inmueble</option>
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select"
                  aria-label="Rango de precio"
                  value={precioRange}
                  onChange={(e) => setPrecioRange(e.target.value)}
                >
                  <option value="">Rango de precio</option>
                  <option value="0-500000">$0 - $500.000</option>
                  <option value="500001-1000000">$500.001 - $1.000.000</option>
                  <option value="1000001-1600000">$1.000.001 - $1.600.000</option>
                  <option value="1600001-999999999">$1.600.001+</option>
                </select>
                <button type="submit" className="btn btn-primary">
                  Buscar
                </button>
              </form>
            </div>
          </div>

          <div className="lf-surface-card lf-right-card lf-right-mid">
            <div className="lf-panel-body">
              <div className="lf-panel-kicker">Opiniones</div>
              <div className="lf-anim-right" key={opinionIndex}>
                <div className="lf-panel-title">{currentOpinion.name}</div>
                <div className="lf-panel-text">{currentOpinion.text}</div>
              </div>
              <div className="mt-auto">
                <div className="lf-stars">{currentOpinion.stars}</div>
                <div className="lf-dots mt-2">
                  {opinions.map((_, i) => (
                    <span key={i} className={`lf-dot${i === opinionIndex ? " active" : ""}`}></span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lf-surface-card lf-right-card lf-right-bottom">
            <div className="lf-panel-body">
              <div className="lf-panel-kicker">¿Por qué elegir Leaseflow?</div>
              <div className="mt-3 lf-anim-right" key={benefitIndex}>
                <div className="lf-benefit-card">
                  <div className="lf-benefit-title">{currentBenefit.title}</div>
                  <div className="lf-benefit-text">{currentBenefit.text}</div>
                </div>
              </div>
              <div className="mt-auto">
                <div className="lf-dots mt-2">
                  {benefits.map((_, i) => (
                    <span key={i} className={`lf-dot${i === benefitIndex ? " active" : ""}`}></span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <Vistas />
      </div>
      </div>
    </>

    

  );
};

export default Home;
