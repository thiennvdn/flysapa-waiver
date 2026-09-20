export default function WaiverText({ vietnamese, english }) {
  return (
    <div className="mb-4 text-sm text-gray-800">
      <p className="font-semibold">{vietnamese}</p>
      <p className="italic mt-1">{english}</p>
    </div>
  );
}
