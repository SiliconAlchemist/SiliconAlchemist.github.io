"""Update only the amber window material in the user's edited scene."""
import bpy, shutil, json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
path=root/'assets/pond-island.blend'
backup=root/'assets/pond-island-before-amber.blend'
if not backup.exists():shutil.copy2(path,backup)
bpy.ops.wm.open_mainfile(filepath=str(path),use_scripts=False)
if bpy.context.object and bpy.context.object.mode!='OBJECT':bpy.ops.object.mode_set(mode='OBJECT')
mat=bpy.data.materials.get('Hut · amber glass')
if mat is None:raise RuntimeError('Amber glass material not found; no changes saved.')
mat.use_nodes=True
bs=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
if bs is None:raise RuntimeError('Expected Principled material; no changes saved.')
color=(1.0,.40,.075,1)
bs.inputs['Base Color'].default_value=(.55,.18,.035,1)
for name in ['Emission Color','Emission Strength']:
    for link in list(bs.inputs[name].links):mat.node_tree.links.remove(link)
bs.inputs['Emission Color'].default_value=color
bs.inputs['Emission Strength'].default_value=3.0
mat.diffuse_color=color;mat['painted']=False
bpy.context.view_layer.update()
windows=[o for o in bpy.context.scene.objects if o.type=='MESH' and any(s.material==mat for s in o.material_slots)]
assert windows,'Amber material has no window objects'
for i,o in enumerate(windows):
    center=sum((v.co for v in o.data.vertices),Vector())/len(o.data.vertices)
    normal=sum((p.normal*p.area for p in o.data.polygons),Vector()).normalized()
    world_normal=(o.matrix_world.to_3x3().inverted().transposed()@normal).normalized()
    position=o.matrix_world@center+world_normal*.10
    name=f'Amber window spill {i+1:02}'
    lamp=bpy.data.objects.get(name)
    if lamp is None:
        data=bpy.data.lights.new(name,'AREA');lamp=bpy.data.objects.new(name,data)
        o.users_collection[0].objects.link(lamp)
    lamp.data.energy=12;lamp.data.color=color[:3];lamp.data.shape='DISK';lamp.data.size=.32
    lamp.parent=o;lamp.matrix_parent_inverse=o.matrix_world.inverted()
    lamp.location=position;lamp.rotation_euler=world_normal.to_track_quat('-Z','Y').to_euler()
    # Position marker survives glTF; the browser supplies the matching local light.
    marker=bpy.data.objects.get('SOCKET_House_01')
    if i==0 and marker:
        marker.parent=o;marker.matrix_parent_inverse=o.matrix_world.inverted();marker.location=position
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(path))
print('AMBER',json.dumps({'windows':[o.name for o in windows],'emission_strength':3.0,'backup':str(backup)}))
