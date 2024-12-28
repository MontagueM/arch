import unreal
import sys
import os

def import_glb(path_to_glb):
    if not os.path.isfile(path_to_glb):
        raise FileNotFoundError(f"File not found: {path_to_glb}")

    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()

    glb_import_task = unreal.AssetImportTask()
    glb_import_task.filename = path_to_glb
    glb_import_task.destination_path = "/Game/Arch/"
    glb_import_task.automated = True
    glb_import_task.replace_existing = True
    glb_import_task.save = True

    asset_tools.import_asset_tasks([glb_import_task])


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    glb_file_path = sys.argv[1]
    import_glb(glb_file_path)
