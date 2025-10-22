export default function EditorPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="h-[128px]">
        <div className="me-7 flex items-center justify-between">
          <nav className="flex items-center justify-between whitespace-nowrap pt-1">
            <div className="flex items-center justify-start">
              <div className="ms-7 h-[54px] w-[54px] border">Logo</div>
              <div className="ms-1 mt-1">
                <div className="ms-3 flex items-center gap-2">
                  <div
                    className="h-5"
                    style={{
                      filter:
                        "opacity(0.4) drop-shadow(0 0 0 white) drop-shadow(0 0 0 white)",
                    }}
                  >
                    mysql
                  </div>
                  <div className="me-1 flex items-center gap-1 text-xl">
                    项目名称 | 版本
                  </div>
                  编辑
                </div>
                <div className="flex items-center">
                  <div className="me-2 flex select-none justify-start text-md">
                    <div className="hover-2 rounded-sm px-3 py-1">文件</div>
                    <div className="hover-2 rounded-sm px-3 py-1">编辑</div>
                    <div className="hover-2 rounded-sm px-3 py-1">视图</div>
                    <div className="hover-2 rounded-sm px-3 py-1">设置</div>
                    <div className="hover-2 rounded-sm px-3 py-1">帮助</div>
                  </div>
                  <div className="rounded-sm bg-gray-100 px-2 py-1 text-gray-500 text-sm">
                    上次保存 2025/10/22 09:27:59
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
        <div className="my-1 flex h-[60px] select-none items-center justify-between overflow-hidden rounded-xl bg-gray-100 px-5 py-1.5 sm:mx-1 xl:mx-6">
          编辑器状态栏
        </div>
      </div>
      <div className="flex h-full flex-1 overflow-y-auto">
        <div className="w-[200px] border">侧边栏</div>
        <div className="flex-1 border">canvas画布</div>
      </div>
    </div>
  );
}
