"use client";

import { FormEvent } from "react";

type Props = {
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function AddProspectModal({ onClose, onSubmit }: Props) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-prospect-title">
      <form className="small-modal" onSubmit={onSubmit}>
        <div className="wizard-header"><div><span className="section-kicker">NUEVO PROSPECTO</span><h2 id="add-prospect-title">Agregar contacto</h2></div><button type="button" onClick={onClose} aria-label="Cerrar">×</button></div>
        <div className="small-modal-body"><label>Nombre y apellido<input name="name" required autoFocus placeholder="Carla Méndez" /></label><div className="form-grid"><label>Empresa<input name="company" required placeholder="Empresa" /></label><label>Cargo<input name="role" placeholder="Fundador/a" /></label><label>Industria<input name="industry" placeholder="Construcción" /></label><label>Email<input name="email" required type="email" placeholder="contacto@empresa.com" /></label></div></div>
        <div className="wizard-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">Guardar prospecto</button></div>
      </form>
    </div>
  );
}
