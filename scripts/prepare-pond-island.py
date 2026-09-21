"""Prepare island_v6 without modifying it. Re-export manual edits with --export-only.

Blender --background --factory-startup --disable-autoexec --python this-file
Add -- --render for a preview of the editable scene.
"""
import bpy, bmesh, math, random, sys, hashlib, json
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[1]
BLEND=ROOT/'assets/pond-island.blend'
GLB=ROOT/'public/models/pond-island.glb'
random.seed(629)

def export():
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.context.scene.objects:
        if o.type in {'MESH','EMPTY'} and not o.hide_render:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(GLB),export_format='GLB',use_selection=True,
        export_animations=False,export_extras=True,export_yup=True,export_apply=True,
        export_materials='EXPORT',export_normals=True)
    print('DELIVERABLE',str(BLEND),GLB.stat().st_size)

if '--export-only' in sys.argv:
    bpy.ops.wm.open_mainfile(filepath=str(BLEND),use_scripts=False)
    export();raise SystemExit

bpy.ops.wm.read_factory_settings(use_empty=True)
with bpy.data.libraries.load(str(ROOT/'assets/island_v6.blend'),link=False) as (src,dst):dst.objects=list(src.objects)
for o in dst.objects:bpy.context.scene.collection.objects.link(o)
bpy.context.view_layer.update()
scene=bpy.context.scene
audit={'source':'island_v6.blend','repairs':[]}
original_objects=list(scene.objects)
original_bounds={o.name:tuple(round(v,5) for corner in o.bound_box for v in (o.matrix_world@Vector(corner))) for o in original_objects if o.type in {'MESH','CURVE'}}

def collection(name):
    c=bpy.data.collections.new(name);scene.collection.children.link(c);return c
terrain_col=collection('01 · Sculpted island')
house_col=collection('02 · Medieval cottage')
forest_col=collection('03 · Authored forest')
pond_col=collection('04 · Pond and mossy stones')
fire_col=collection('05 · Fire and meadow')
rig_col=collection('06 · Light and effect markers')
root=bpy.data.objects.new('IslandRoot',None);terrain_col.objects.link(root)
root['source_island']='island_v6.blend';root['style']='Painted forest cottage and still jade pond'
# Present the hut doorway and pond together without moving authored objects.
root.rotation_euler.z=-math.pi/2;root.scale=(.7,.7,.7)

def move(o,col):
    if col not in o.users_collection:col.objects.link(o)
    for c in list(o.users_collection):
        if c!=col:c.objects.unlink(o)

def material(name,base,painted=True,emission=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*base,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*base,1);bs.inputs['Roughness'].default_value=.92
    if painted:
        vc=m.node_tree.nodes.new('ShaderNodeVertexColor');vc.layer_name='Paint'
        m.node_tree.links.new(vc.outputs['Color'],bs.inputs['Base Color'])
    if emission:
        bs.inputs['Emission Color'].default_value=(*base,1);bs.inputs['Emission Strength'].default_value=emission
    m['painted']=painted
    return m

palettes={
 'meadow':((.065,.17,.075),(.32,.48,.13)),
 'cliff':((.085,.105,.15),(.43,.32,.22)),
 'canopy':((.025,.115,.09),(.38,.56,.16)),
 'trunk':((.09,.045,.05),(.37,.205,.095)),
 'plaster':((.36,.285,.24),(.86,.73,.48)),
 'timber':((.07,.035,.035),(.29,.13,.065)),
 'door':((.15,.07,.045),(.46,.26,.11)),
 'roof':((.17,.075,.105),(.57,.24,.12)),
 'stone':((.10,.15,.17),(.39,.43,.34)),
 'foundation':((.14,.18,.16),(.41,.38,.27)),
 'iron':((.035,.055,.075),(.17,.22,.23)),
 'grass':((.065,.20,.08),(.37,.49,.13)),
}
names={'meadow':'Meadow · fern and honey','cliff':'Cliff · slate and ochre','canopy':'Canopy · celadon green','trunk':'Bark · warm cedar','plaster':'Hut · warm lime plaster','timber':'Hut · chestnut beams','door':'Hut · oiled oak','roof':'Hut · weathered terracotta','stone':'Pond rocks · moss and blue slate','foundation':'Hut · mossy foundation','iron':'Hut · blue iron','grass':'Grass · sunlit tips'}
mats={k:material(names[k],hi) for k,(lo,hi) in palettes.items()}
window_mat=material('Hut · amber glass',(1.0,.40,.075),False,3.0)
water_mat=material('Pond · jade water',(.075,.36,.32),True)
water_mat['painted']=False
sun=Vector((.5,.4,.8)).normalized()
def clamp(x):return max(0,min(1,x))
def mix(a,b,t):return tuple(a[i]*(1-t)+b[i]*t for i in range(3))
def assign(o,materials):
    indices=[p.material_index for p in o.data.polygons]
    o.data.materials.clear()
    for m in materials:o.data.materials.append(m)
    for p,i in zip(o.data.polygons,indices):p.material_index=min(i,len(materials)-1)

def paint(o,kind):
    me=o.data;me.update()
    old=me.color_attributes.get('Paint')
    if old:me.color_attributes.remove(old)
    attr=me.color_attributes.new(name='Paint',type='BYTE_COLOR',domain='CORNER');me.color_attributes.active_color=attr
    lo,hi=palettes.get(kind,palettes['stone'])
    zmin=min(v.co.z for v in me.vertices);zmax=max(v.co.z for v in me.vertices);dz=max(zmax-zmin,.001)
    center=sum((v.co for v in me.vertices),Vector())/len(me.vertices)
    for p in me.polygons:
        c=p.center;n=p.normal;key=kind
        if kind=='meadow' and p.material_index>0:key='cliff';lo,hi=palettes[key]
        elif kind=='meadow':lo,hi=palettes['meadow']
        field=.5+.20*math.sin(c.x*1.3+c.y*.83)+.12*math.cos(c.z*3.4-c.y*.72)
        if key=='canopy':
            n=(c-center).normalized();t=clamp(.2+.6*max(0,n.dot(sun))+.18*(c.z-zmin)/dz)
        else:t=clamp(.25+.4*max(0,n.dot(sun))+.25*field)
        color=mix(lo,hi,t)
        if key=='stone' and n.z>.25:
            moss=clamp((n.z-.25)*.7+field*.28)
            color=mix(color,(.22,.32,.115),moss)
        if key=='roof':
            # Muted tile variation, never independent noise per triangle.
            color=tuple(v*(.9+.14*field) for v in color)
        for li in p.loop_indices:attr.data[li].color=(*color,1)

def clean(me,merge=False):
    bm=bmesh.new();bm.from_mesh(me)
    before=(len(bm.verts),len(bm.faces))
    if merge:bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001)
    bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=.00001)
    loose=[v for v in bm.verts if not v.link_faces]
    if loose:bmesh.ops.delete(bm,geom=loose,context='VERTS')
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free();me.update()
    return before,(len(me.vertices),len(me.polygons))

def realize(o):
    # Conversion must not propagate applied mirrors into every linked roof tile.
    # Evaluate a private data block once, then discard only this object's stack.
    o.data=o.data.copy()
    if o.type=='MESH':
        deps=bpy.context.evaluated_depsgraph_get()
        evaluated=o.evaluated_get(deps)
        data=bpy.data.meshes.new_from_object(evaluated,preserve_all_data_layers=True,depsgraph=deps)
        o.modifiers.clear();o.data=data
    else:
        bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
        bpy.ops.object.convert(target='MESH')
    if len(o.data.vertices)>100000:raise RuntimeError('Unexpectedly dense object: '+o.name)

terrain=bpy.data.objects['grass_top'];terrain.name='GEO_Terrain'
for mod in list(terrain.modifiers):terrain.modifiers.remove(mod)
# Weld coincident seam vertices and remove zero-area strips, preserving groups.
before,after=clean(terrain.data,True)
audit['repairs'].append({'terrain_before':before,'terrain_after':after})
assign(terrain,[mats['meadow'],mats['cliff']]);paint(terrain,'meadow');terrain['role']='terrain'
move(terrain,terrain_col);terrain.parent=root
# Surface placement is measured in the original island coordinate system.
tm=terrain.matrix_basis.copy()
bvh=BVHTree.FromPolygons([tm@v.co for v in terrain.data.vertices],[list(p.vertices) for p in terrain.data.polygons])
def ground(x,y):
    p,_,_,_=bvh.ray_cast(Vector((x,y,20)),Vector((0,0,-1)))
    return p.z if p else -100

# Pond: preserve the concave perimeter, replace the inverted solid with a level
# triangulated surface. Red vertex color stores shore proximity for web shading.
pond=bpy.data.objects['pond'];pm=pond.matrix_world.copy()
cap=max((p for p in pond.data.polygons if len(p.vertices)>4),key=lambda p:(pm@p.center).z)
outline=[pm@pond.data.vertices[i].co for i in cap.vertices]
if sum(outline[i].x*outline[(i+1)%len(outline)].y-outline[(i+1)%len(outline)].x*outline[i].y for i in range(len(outline)))<0:outline.reverse()
center=sum(outline,Vector())/len(outline);level=.12
bm=bmesh.new();boundary=[bm.verts.new((p.x,p.y,level)) for p in outline];bm.faces.new(boundary)
bmesh.ops.triangulate(bm,faces=list(bm.faces),ngon_method='EAR_CLIP')
bmesh.ops.subdivide_edges(bm,edges=list(bm.edges),cuts=4,use_grid_fill=True)
bmesh.ops.triangulate(bm,faces=list(bm.faces))
bm.normal_update()
down=[f for f in bm.faces if f.normal.z<0]
if down:bmesh.ops.reverse_faces(bm,faces=down)
me=bpy.data.meshes.new('Pond · level shoreline surface');bm.to_mesh(me);bm.free();me.update()
def shore_weight(p):
    distances=[]
    for i,a in enumerate(outline):
        b=outline[(i+1)%len(outline)];d=Vector((b.x-a.x,b.y-a.y));q=Vector((p.x-a.x,p.y-a.y))
        t=clamp(q.dot(d)/max(d.length_squared,1e-9));distances.append((q-d*t).length)
    return 1-clamp(min(distances)/2.2)
weights=[shore_weight(v.co) for v in me.vertices]
pond.data=me;pond.parent=root;pond.matrix_basis=Matrix.Identity(4);pond.name='FX_Pond';pond['effect']='pond';move(pond,pond_col);assign(pond,[water_mat])
me.uv_layers.new(name='UVMap');me.color_attributes.new(name='Paint',type='BYTE_COLOR',domain='CORNER')
# Adding a mesh attribute reallocates CustomData; reacquire both RNA handles.
uv=me.uv_layers['UVMap'];attr=me.color_attributes['Paint'];me.color_attributes.active_color=attr
xs=[p.x for p in outline];ys=[p.y for p in outline]
for p in me.polygons:
    for li in p.loop_indices:
        i=me.loops[li].vertex_index;v=me.vertices[i].co;uv.data[li].uv=((v.x-min(xs))/(max(xs)-min(xs)),(v.y-min(ys))/(max(ys)-min(ys)))
        w=weights[i];attr.data[li].color=(.025+.135*w,.14+.25*w,.17+.10*w,1)
audit['repairs'].append('Rebuilt negatively scaled, sloping pond as level triangulatable surface with shore weights.')

# Retain rock placement and scale. Reduce excessive normal displacement; close
# each cleaned stone around its convex hull to avoid folded interior facets.
for o in original_objects:
    if not o.name.startswith('rock'):continue
    deps=bpy.context.evaluated_depsgraph_get()
    evaluated_mesh=bpy.data.meshes.new_from_object(o.evaluated_get(deps),depsgraph=deps)
    stone_coords=[v.co.copy() for v in evaluated_mesh.vertices]
    move(o,pond_col);o.parent=root
    for mod in list(o.modifiers):o.modifiers.remove(mod)
    # Rebuild only hull faces from their outward envelope using a fresh mesh.
    bm=bmesh.new()
    for v in stone_coords:bm.verts.new(v)
    result=bmesh.ops.convex_hull(bm,input=list(bm.verts),use_existing_faces=False)
    unused=[v for v in bm.verts if not v.link_faces]
    if unused:bmesh.ops.delete(bm,geom=unused,context='VERTS')
    bmesh.ops.smooth_vert(bm,verts=list(bm.verts),factor=.25,use_axis_x=True,use_axis_y=True,use_axis_z=True)
    rock_mesh=bpy.data.meshes.new('Closed pond stone')
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(rock_mesh);bm.free();o.data=rock_mesh
    assign(o,[mats['stone']]);paint(o,'stone');o['role']='pond_rock';o.name='POND_'+o.name
audit['repairs'].append('Removed aggressive displacement and rebuilt 26 closed convex pond stones; retained positions and dimensions.')

# Realize the hut's structural mirrors/bevels for reliable export. Keep authored
# object transforms; the cottage remains separately editable in the new file.
house=bpy.data.objects['House'];house.parent=root;move(house,house_col)
mapping={'Wall':'plaster','Wood':'timber','Wood.001':'door','Wood.002':'timber','Stone':'foundation','Ground':'meadow','Roof':'roof','Metal':'iron'}
for o in list(house.children):
    if o.type not in {'MESH','CURVE'}:
        o.hide_render=True
        continue
    oldmats=[m.name if m else '' for m in o.data.materials];kind=mapping.get(oldmats[0] if oldmats else '','iron')
    # The supplied plinth remains, with a lower subdivision level for the web.
    for m in o.modifiers:
        if m.type=='SUBSURF':m.levels=min(m.levels,1);m.render_levels=min(m.render_levels,1)
        if m.type=='BEVEL':m.segments=min(m.segments,2)
    realize(o);clean(o.data)
    assign(o,[window_mat if oldmats==['Material'] else mats[kind]])
    if oldmats!=['Material']:paint(o,kind)
    o['role']='house';o.name='HUT_'+o.name;move(o,house_col)

# Exact geometry copies share data again, while all authored tree transforms
# and species are retained. An overlapping extra trunk is removed.
cache={};seen=set();tree_count=0
for parent in [o for o in original_objects if o.type=='EMPTY' and 'tree' in o.name.lower()]:
    parent.parent=root;move(parent,forest_col)
    for o in list(parent.children):
        role='canopy' if o.name.startswith('leaf') else 'trunk'
        signature=original_bounds[o.name]
        if role=='trunk' and signature in seen:
            audit['repairs'].append('Removed coincident duplicate trunk '+o.name);bpy.data.objects.remove(o,do_unlink=True);continue
        seen.add(signature)
        for mod in list(o.modifiers):
            if mod.type=='SOLIDIFY':o.modifiers.remove(mod)
        realize(o);clean(o.data)
        assign(o,[mats[role]]);paint(o,role);o['role']=role;move(o,forest_col)
        if role=='canopy':
            tree_count+=1
            # Rounded canopy normals join separate leaves into painted masses.
            ctr=sum((v.co for v in o.data.vertices),Vector())/len(o.data.vertices)
            for p in o.data.polygons:p.use_smooth=True
            normals=[(v.co-ctr).normalized() for v in o.data.vertices]
            o.data.normals_split_custom_set_from_vertices(normals)
        key=hashlib.sha256((role+str([(tuple(v.co)) for v in o.data.vertices])+str([tuple(p.vertices) for p in o.data.polygons])).encode()).hexdigest()
        if key in cache:o.data=cache[key]
        else:cache[key]=o.data
root['tree_count']=tree_count

def mesh(name,coords,faces,col,mat):
    me=bpy.data.meshes.new(name);me.from_pydata(coords,[],faces);me.update();o=bpy.data.objects.new(name,me);col.objects.link(o);o.parent=root;me.materials.append(mat);return o
def socket(name,point):
    o=bpy.data.objects.new(name,None);rig_col.objects.link(o);o.parent=root;o.location=point;o.empty_display_size=.25;return o

# Preserve the existing campfire design and animation, beside the front door.
fire_origin=Vector((3.5,-1.9,ground(3.5,-1.9)+.07))
with bpy.data.libraries.load(str(ROOT/'assets/painted-island.blend'),link=False) as (src,dst):
    dst.objects=[n for n in src.objects if n.startswith(('Fire ring','Firewood','Flame','SOCKET_Fire'))]
fire_src=next(o for o in dst.objects if o.name.startswith('SOCKET_Fire'))
for o in dst.objects:fire_col.objects.link(o)
bpy.context.view_layer.update();old_center=fire_src.matrix_world.translation.copy()
for o in dst.objects:
    if o==fire_src:continue
    world=o.matrix_world.copy();world.translation-=old_center
    world=Matrix.Translation(fire_origin+Vector((0,0,.22)))@Matrix.Scale(.75,4)@world
    o.parent=root;o.matrix_basis=world
    if o.name.startswith('Flame'):o['effect']='flame'
bpy.data.objects.remove(fire_src,do_unlink=True)
socket('SOCKET_Fire_01',fire_origin+Vector((0,0,.35)))
socket('SOCKET_House_01',(1.25,.1,1.5))

# Small meadow details, kept off the water and the house foundation.
gv=[];gf=[]
for i in range(5):
    a=i*2.4;x=.10*math.cos(a);y=.1*math.sin(a);k=len(gv);h=.23+(i%3)*.08
    gv.extend([(x-.04,y,0),(x+.04,y,0),(x+.09*math.sin(a),y+.05,h)]);gf.append((k,k+1,k+2))
tuft=mesh('GRASS_001',gv,gf,fire_col,mats['grass']);paint(tuft,'grass');tuft['role']='grass'
pond_bvh=BVHTree.FromPolygons([v.co for v in me.vertices],[list(p.vertices) for p in me.polygons])
placed=0
for i in range(330):
    x=random.uniform(-9,9);y=random.uniform(-12.5,12.5);z=ground(x,y)
    hit,_,_,_=pond_bvh.ray_cast(Vector((x,y,10)),Vector((0,0,-1)))
    if z<-.7 or (abs(x)<2.6 and abs(y)<2.6) or hit or (Vector((x,y,0))-Vector((fire_origin.x,fire_origin.y,0))).length<.9:continue
    o=tuft if placed==0 else tuft.copy()
    if placed:fire_col.objects.link(o)
    o.name=f'GRASS_{placed+1:03}';o.location=(x,y,z+.02);o.rotation_euler.z=random.random()*math.tau;placed+=1
root['grass_count']=placed

# Remove camera, lamp and the loose guide circle; retain only delivered objects.
for o in list(scene.objects):
    if o.name in {'Camera','Light','Circle'}:bpy.data.objects.remove(o,do_unlink=True)
for c in list(bpy.data.collections):
    if not c.objects and not c.children:bpy.data.collections.remove(c)
scene.world=bpy.data.worlds.new('Blue-hour painted sky');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.10,.16,.22,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
def light(name,kind,loc,color,energy):
    d=bpy.data.lights.new(name,kind);d.energy=energy;d.color=color;o=bpy.data.objects.new(name,d);rig_col.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
    if kind=='AREA':d.shape='DISK';d.size=10
    return o
light('Warm sky','AREA',(-8,-10,15),(1,.86,.65),2100);light('Cool fill','AREA',(10,4,10),(.57,.74,1),1600)
bpy.context.view_layer.update();light('Firelight','POINT',root.matrix_world@fire_origin,(1,.32,.055),65)
cam_data=bpy.data.cameras.new('Cottage scene');cam=bpy.data.objects.new('Cottage scene',cam_data);rig_col.objects.link(cam)
cam.location=(11,-25,19);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam_data.type='ORTHO';cam_data.ortho_scale=24;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'outputs/pond-island-blender.png')
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA';area.spaces.active.shading.type='MATERIAL'
bpy.ops.object.select_all(action='DESELECT');terrain.select_set(True);bpy.context.view_layer.objects.active=terrain
bpy.ops.outliner.orphans_purge(do_recursive=True)
(ROOT/'outputs/pond-island-audit.json').write_text(json.dumps(audit,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND));export()
if '--render' in sys.argv:bpy.ops.render.render(write_still=True)
