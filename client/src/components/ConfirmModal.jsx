import { Button, Modal } from 'react-bootstrap';

const ConfirmModal = ({ show, title = 'Please confirm', message, confirmText = 'Delete', busy, onConfirm, onCancel }) => (
  <Modal show={show} onHide={busy ? undefined : onCancel} centered>
    <Modal.Header closeButton>
      <Modal.Title className="fs-5">{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>{message}</Modal.Body>
    <Modal.Footer>
      <Button variant="light" onClick={onCancel} disabled={busy}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'Please wait...' : confirmText}</Button>
    </Modal.Footer>
  </Modal>
);

export default ConfirmModal;
