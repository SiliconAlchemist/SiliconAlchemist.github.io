"""Build an editable scene from the user's island_v4 and tree_stylised_3.

Run with Blender --background --factory-startup --disable-autoexec --python ...
The two source files are never saved over. --export-only exports manual edits
from assets/painted-island.blend without regenerating its composition.
"""
import bpy
import math
import random
import sys
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
BLEND = ROOT / 'assets' / 'painted-island.blend'
GLB = ROOT / 'assets' / 'legacy-models' / 'painted-island.glb'
random.seed(8317)

def export():
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type == 'MESH' or o.name.startswith('SOCKET_') or o.name == 'IslandRoot':
            o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(GLB), export_format='GLB', use_selection=True,
        export_animations=False, export_extras=True, export_yup=True,
        export_apply=True, export_materials='EXPORT', export_normals=True)
    print('DELIVERABLE', str(BLEND), str(GLB), GLB.stat().st_size)

if '--export-only' in sys.argv:
    bpy.ops.wm.open_mainfile(filepath=str(BLEND), use_scripts=False)
    export()
    raise SystemExit

bpy.ops.wm.read_factory_settings(use_empty=True)

def collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c

terrain_col = collection('01 — Island · your sculpt')
forest_col = collection('02 — Trees · linked editable meshes')
camp_col = collection('03 — Campsite')
detail_col = collection('04 — Meadow and river')
rig_col = collection('05 — Lighting and effect markers')

def append_objects(file, names, col):
    with bpy.data.libraries.load(str(ROOT/'assets'/file), link=False) as (src, dst):
        dst.objects = [n for n in src.objects if names(n)]
    for o in dst.objects:
        col.objects.link(o)
    bpy.context.view_layer.update()
    return dst.objects

root = bpy.data.objects.new('IslandRoot', None)
terrain_col.objects.link(root)
root['source_island'] = 'island_v4.blend'
root['source_tree'] = 'tree_stylised_3.blend'
root['style'] = 'Painted moonlit meadow; vertex palettes shared by Blender and Three.js'

def material(name, color, painted=False, emission=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Roughness'].default_value = .88
    if painted:
        vc = m.node_tree.nodes.new('ShaderNodeVertexColor')
        vc.layer_name = 'Paint'
        m.node_tree.links.new(vc.outputs['Color'], bs.inputs['Base Color'])
    if emission:
        bs.inputs['Emission Color'].default_value = (*color, 1)
        bs.inputs['Emission Strength'].default_value = emission
    m['painted'] = painted
    return m

grass = material('Paint · meadow', (.32,.48,.09), True)
rock = material('Paint · warm stone', (.31,.22,.17), True)
leaves = material('Paint · broadleaf canopy', (.25,.43,.12), True)
bark = material('Paint · cedar bark', (.30,.14,.07), True)
tuft_mat = material('Meadow · blades', (.23,.38,.075), True)
water_mat = material('FX · river', (.12,.43,.43))
foam_mat = material('FX · foam', (.63,.83,.70), emission=.15)
stone_mat = material('Riverbank stone', (.29,.33,.24))
petal_mat = material('Meadow · wildflowers', (.86,.68,.31))

def set_materials(o, mats):
    indices=[p.material_index for p in o.data.polygons]
    o.data.materials.clear()
    for m in mats: o.data.materials.append(m)
    for p,i in zip(o.data.polygons,indices):p.material_index=min(i,len(mats)-1)

def paint(o, fn):
    old = o.data.color_attributes.get('Paint')
    if old: o.data.color_attributes.remove(old)
    attr = o.data.color_attributes.new(name='Paint', type='BYTE_COLOR', domain='CORNER')
    o.data.color_attributes.active_color = attr
    for p in o.data.polygons:
        color = fn(p)
        for i in p.loop_indices: attr.data[i].color = (*color, 1)

def mix(a,b,t): return tuple(a[i]*(1-t)+b[i]*t for i in range(3))
def clamp(t): return max(0,min(1,t))

# Preserve the hand-shaped terrain and named vertex groups. The Solidify
# modifiers in the source are outline shells, not structural terrain.
island = append_objects('island_v4.blend', lambda n:n=='grass_top', terrain_col)[0]
island.name = 'GEO_Terrain'
for m in list(island.modifiers): island.modifiers.remove(m)
transform = Matrix.Scale(.70,4) @ Matrix.Rotation(math.pi/2,4,'Z') @ island.matrix_world
island.data.transform(transform)
island.matrix_world = Matrix.Identity(4)
island.parent = root
island.data.update()
set_materials(island, [grass,rock])
sun = Vector((-.65,-.35,.8)).normalized()
def terrain_color(p):
    c=p.center
    field=.5+.24*math.sin(c.x*1.25+c.y*.75)+.16*math.cos(c.y*2-c.x*.6)
    if p.material_index==0:
        return mix((.07,.21,.075),(.25,.46,.115),clamp(field*.75+max(0,p.normal.dot(sun))*.24))
    p.material_index=1
    t=clamp(.30+max(0,p.normal.dot(sun))*.50+random.random()*.18)
    return mix((.10,.145,.15),(.46,.315,.19),t)
paint(island,terrain_color)
island['role']='terrain'
verts=[v.co.copy() for v in island.data.vertices]
bvh=BVHTree.FromPolygons(verts,[list(p.vertices) for p in island.data.polygons])
def ground(x,y):
    hit,normal,_,_=bvh.ray_cast(Vector((x,y,15)),Vector((0,0,-1)))
    return hit.z if hit is not None else -100

# Latest tree: use the already-realized leaves and discard outline duplication.
tree_parts=append_objects('tree_stylised_3.blend',lambda n:n in {'tree_curve','leaf_geo_vol'},forest_col)
for o in tree_parts:
    for m in list(o.modifiers): o.modifiers.remove(m)
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH')
    o.data.transform(o.matrix_world)
    o.matrix_world=Matrix.Identity(4)
    o.data.update()
    canopy='leaf' in o.name
    o.name='TREE_Canopy_01' if canopy else 'TREE_Trunk_01'
    set_materials(o,[leaves if canopy else bark])
    for p in o.data.polygons:p.material_index=0
    def tree_color(p):
        c=p.center
        if canopy:
            # Broad canopy lighting gives coherent masses rather than sparkling
            # individually lit leaves. Fine variation stays in the painted color.
            n=Vector(((c.x-.45)/2.2,(c.y+.1)/1.8,(c.z-3.6)/2.0)).normalized()
            t=clamp(.34+.45*max(0,n.dot(sun))+.12*math.sin(c.x*3+c.z*4)+random.random()*.08)
            return mix((.035,.16,.105),(.25,.52,.15),t)
        return mix((.16,.075,.042),(.48,.27,.12),clamp(.25+max(0,p.normal.dot(sun))*.5+random.random()*.1))
    paint(o,tree_color)
    o['role']='canopy' if canopy else 'trunk'

placements=[(-6.6,1.4,.87,.35),(-4.1,3.2,1.02,-.5),(-.7,3.8,.78,1.7),
            (3.3,3.1,1.04,-.65),(6.3,1.3,.86,2.2),(-7.1,-1.6,.62,.4),
            (6.6,-1.5,.65,2.7)]
for i,(x,y,s,a) in enumerate(placements):
    for source in tree_parts:
        o=source if i==0 else source.copy()
        if i:forest_col.objects.link(o)
        o.name=('TREE_Canopy_' if source.get('role')=='canopy' else 'TREE_Trunk_')+f'{i+1:02}'
        o.parent=root;o.location=(x,y,ground(x,y)+.15*s);o.rotation_euler=(0,0,a);o.scale=(s,s,s)

# Reuse the existing camp's authored meshes; move the whole camp coherently
# onto the new surface so the floor, poles and fire remain aligned.
prefixes=('Tent','Ridgepole','Bedroll','Fire ring','Firewood','Flame','Stool','Lantern','Path stepping')
camp=append_objects('three-moons-landscape.blend',lambda n:n.startswith(prefixes),camp_col)
camp_scale=.78
camp_origin=Vector((.0,-1.1,ground(0,-1.1)+.08))
def old_surface(x,y):return .14+.25*math.sin(x*.65)*math.cos(y*.8)+max(0,y-1)*.12
for o in camp:
    # Bring source geometry into the new scene without parenting offsets.
    o.matrix_world=Matrix.Translation(camp_origin) @ Matrix.Scale(camp_scale,4) @ o.matrix_world
    o.parent=root
    if o.name.startswith('Flame'):
        o['effect']='flame';o.rotation_euler=(0,0,0)
        o.scale.z*=.75

def socket(name,location):
    o=bpy.data.objects.new(name,None);rig_col.objects.link(o);o.parent=root;o.location=location;o.empty_display_size=.25
    return o
fire_pos=camp_origin+Vector((2.8,-1.45,old_surface(2.8,-1.45)+.5))*camp_scale
socket('SOCKET_Fire_01',fire_pos)['effect']='fire'
socket('SOCKET_Tent_01',camp_origin+Vector((.1,-.55,1))*camp_scale)['effect']='lantern'

def mesh(name,coords,faces,col,mat):
    me=bpy.data.meshes.new(name);me.from_pydata(coords,[],faces);me.update()
    o=bpy.data.objects.new(name,me);col.objects.link(o);o.parent=root;me.materials.append(mat);return o

# River follows the real surface. Waterfall begins exactly at the island edge.
river_pts=[]
for i in range(58):
    x=-7.7+i*.315;y=-3.55+.34*math.sin(x*.65)
    z=ground(x,y)
    if z < -1.3:
        if river_pts: break
        continue
    river_pts.append((x,y,z+.065))
rv=[]
for x,y,z in river_pts:rv.extend([(x,y-.20,z),(x,y+.20,z)])
river=mesh('FX_River',rv,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(river_pts)-1)],detail_col,water_mat)
river['effect']='water'
uv=river.data.uv_layers.new(name='UVMap')
for p in river.data.polygons:
    for li in p.loop_indices:
        vi=river.data.loops[li].vertex_index;uv.data[li].uv=(vi%2,vi//2*.18)
if river_pts:
    x,y,z=river_pts[-1]
    # Continue beyond the bank before descending, avoiding an interior ribbon.
    end=x+.52
    fall=mesh('FX_Waterfall',[(x,y-.21,z),(x,y+.21,z),(x+.18,y-.22,z-.16),(x+.18,y+.22,z-.16),(end-.24,y,z-.65),(end+.24,y,z-.65),(end-.07,y-.06,-5.5),(end+.35,y-.06,-5.5)],[(0,1,3,2),(2,3,5,4),(4,5,7,6)],detail_col,water_mat)
    fall['effect']='waterfall'
    uv=fall.data.uv_layers.new(name='UVMap')
    for p in fall.data.polygons:
        for li in p.loop_indices:
            vi=fall.data.loops[li].vertex_index;uv.data[li].uv=(vi%2,[0,.08,.3,2.7][vi//2])
    socket('SOCKET_Splash_01',(end+.16,y,-5.4))

# A low-cost linked grass tuft: six tapered blades, a painted base-to-tip tint.
gv=[];gf=[]
for i in range(6):
    a=i*2.4;w=.035;h=.16+(i%3)*.07;x=.10*math.cos(a);y=.1*math.sin(a)
    k=len(gv);gv.extend([(x-w,y,0),(x+w,y,0),(x+.07*math.sin(a),y+.05,h)])
    gf.append((k,k+1,k+2))
tuft=mesh('GRASS_001',gv,gf,detail_col,tuft_mat)
paint(tuft,lambda p:mix((.13,.29,.04),(.38,.51,.095),random.random()))
for i in range(280):
    x=random.uniform(-8.7,8.7);y=random.uniform(-5.2,4.8);z=ground(x,y)
    if z < -.75 or ((x/3.4)**2+((y+1.3)/2.2)**2<1) or abs(y-(-3.55+.34*math.sin(x*.65)))<.5:continue
    o=tuft if i==0 else tuft.copy()
    if o!=tuft:detail_col.objects.link(o)
    o.name=f'GRASS_{i+1:03}';o.location=(x,y,z+.025);o.rotation_euler.z=random.random()*math.tau;o.scale=(1,1,random.uniform(.75,1.7));o['role']='grass'
# Keep the source tuft on the surface as well even if the first sample skipped.
tuft.location=(-3.1,-2.7,ground(-3.1,-2.7)+.03);tuft['role']='grass'

for i in range(34):
    x=random.uniform(-8.5,8.5);y=random.uniform(-4.8,4.5);z=ground(x,y)
    if z<-.7 or (abs(x)<3 and -3<y<1):continue
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(x,y,z+.06))
    o=bpy.context.object;o.name=f'PROP_RiverStone_{i:02}';o.parent=root
    for c in list(o.users_collection):c.objects.unlink(o)
    detail_col.objects.link(o);s=random.uniform(.12,.36);o.scale=(s,s*.8,s*.6);o.data.materials.append(stone_mat)

# An art-direction rig for a useful Blender opening view. The web scene has
# corresponding moonlight and camp lights; it adds motion at runtime.
scene=bpy.context.scene
scene.world=bpy.data.worlds.new('Blue-hour sky');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.115,.19,.24,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
def light(name,kind,loc,color,energy):
    data=bpy.data.lights.new(name,kind);data.energy=energy;data.color=color
    o=bpy.data.objects.new(name,data);rig_col.objects.link(o);o.location=loc
    o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
    if kind=='AREA':data.shape='DISK';data.size=12
    return o
light('Moonlight · cream','AREA',(-8,-10,15),(1,.91,.69),2100)
light('Sky fill · blue','AREA',(8,4,9),(.54,.77,1),1700)
light('Campfire warmth','POINT',fire_pos,(1,.37,.075),80)
cam_data=bpy.data.cameras.new('Scene camera');cam=bpy.data.objects.new('Scene camera',cam_data);rig_col.objects.link(cam)
cam.location=(15,-25,15);cam.rotation_euler=(Vector((0,0,.1))-cam.location).to_track_quat('-Z','Y').to_euler()
cam_data.type='ORTHO';cam_data.ortho_scale=25;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(ROOT/'outputs'/'painted-island-blender.png')
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.shading.type='MATERIAL'
bpy.ops.object.select_all(action='DESELECT');island.select_set(True);bpy.context.view_layer.objects.active=island
# Remove imported orphan materials and missing external texture datablocks.
bpy.ops.outliner.orphans_purge(do_recursive=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
export()
if '--render' in sys.argv:bpy.ops.render.render(write_still=True)
