import { useNavigate } from "react-router-dom";
import CommunityForm from "../components/CommunityForm";

export default function CommunityNew() {
  const navigate = useNavigate();
  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Nueva comunidad</h1>
      </div>
      <CommunityForm
        inicial={null}
        onSaved={(c) => navigate(`/c/${c.slug}`, { replace: true })}
        onCancel={() => navigate(-1)}
      />
    </>
  );
}
