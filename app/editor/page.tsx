export default function EditorPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div>Header</div>
      <div className="flex h-full overflow-y-auto">
        <div>侧边栏</div>
        <div>canvas画布</div>
      </div>
    </div>
  );
}
