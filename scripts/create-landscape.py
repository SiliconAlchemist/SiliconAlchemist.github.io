import bpy, math, random, os
from mathutils import Vector
random.seed(37)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(root,'public','models'),exist_ok=True)
os.makedirs(os.path.join(root,'assets'),exist_ok=True)

def mat(name,color,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.9
 if emission:bs.inputs['Emission Color'].default_value=(*color,1);bs.inputs['Emission Strength'].default_value=emission
 return m
grass=[mat('Moss '+str(i),c) for i,c in enumerate([(.045,.26,.045),(.08,.34,.055),(.035,.21,.045),(.13,.37,.075),(.065,.29,.055)])]
rock=[mat('Slate facet '+str(i),c) for i,c in enumerate([(.12,.15,.23),(.19,.22,.32),(.24,.23,.34),(.16,.20,.28),(.28,.27,.37),(.09,.13,.20)])]
pine=[mat('Pine needles '+str(i),c) for i,c in enumerate([(.025,.15,.045),(.04,.23,.055),(.075,.29,.065),(.035,.19,.04)])]
wood=mat('Warm cedar',(.25,.12,.08)); bark=mat('Pine bark',(.13,.10,.13)); canvas=mat('Canvas moonlit',(.62,.55,.43)); canvas2=mat('Canvas warm',(.8,.47,.22)); dark=mat('Tent opening',(.10,.045,.045)); glow=mat('Lantern light',(1,.5,.11),5); fire=mat('Fire golden',(1,.26,.025),4); ember=mat('Fire heart',(1,.69,.15),7); water=mat('Moonlit stream',(.13,.46,.55),.23)
def mesh(name,v,f,materials):
 me=bpy.data.meshes.new(name);me.from_pydata(v,[],f);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o)
 for m in materials:me.materials.append(m)
 for p in me.polygons:p.material_index=random.randrange(len(materials))
 return o
def cube(name,loc,scale,material):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(material);return o
def ico(name,loc,scale,material,sub=1):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.rotation_euler=(random.random(),random.random(),random.random());o.data.materials.append(material);return o
def rod(name,a,b,r,material,verts=7):
 mid=(Vector(a)+Vector(b))*.5;d=Vector(b)-Vector(a);bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d.length,location=mid);o=bpy.context.object;o.name=name;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(material);return o
def surface(x,y):return .14+ .25*math.sin(x*.65)*math.cos(y*.8)+ max(0,y-1)*.12
# Concentric irregular rings, individually triangulated for a faceted island.
n=56;v=[(0,0,surface(0,0))]
for ring in range(1,7):
 for i in range(n):
  a=2*math.pi*i/n;rad=ring/6;w=1+random.uniform(-.055,.055);x=10.3*rad*math.cos(a)*w;y=5.0*rad*math.sin(a)*w;v.append((x,y,surface(x,y)+random.uniform(-.07,.07)))
f=[(0,1+i,1+(i+1)%n) for i in range(n)]
for r in range(1,6):
 for i in range(n):
  a=1+(r-1)*n+i;b=1+(r-1)*n+(i+1)%n;c=1+r*n+i;d=1+r*n+(i+1)%n;f.extend([(a,c,b),(b,c,d)])
mesh('Triangulated moss island',v,f,grass)
edge=v[-n:];rv=list(edge)
for level in range(1,4):
 for i,(x,y,z) in enumerate(edge):
  fac=[1,.94,.62,.20][level];rv.append((x*fac+random.uniform(-.35,.35),y*fac+random.uniform(-.25,.25),-level*1.15+random.uniform(-.4,.2)))
rf=[]
for layer in range(3):
 for i in range(n):
  a=layer*n+i;b=layer*n+(i+1)%n;c=(layer+1)*n+i;d=(layer+1)*n+(i+1)%n;rf.extend([(a,b,c),(b,d,c)])
rv.append((0,0,-4.5));rf.extend([(3*n+i,3*n+(i+1)%n,len(rv)-1) for i in range(n)])
mesh('Floating island crag',rv,rf,rock)
# A meandering stream across the front, and a waterfall over the edge.
wv=[]
for i in range(32):
 x=-8.8+i*.53;y=-2.4+.38*math.sin(x*.8);z=surface(x,y)+.06;wv.extend([(x,y-.27,z),(x,y+.27,z)])
mesh('Silver blue creek',wv,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(31)],[water])
mesh('Waterfall',[(7.7,-2.36,.12),(8.2,-1.96,.12),(8.3,-2.07,-3.3),(7.9,-2.47,-3.5)],[(0,1,2),(0,2,3)],[water])
# A forest of layered low-poly pines, keeping the campsite clearing open.
def tree(x,y,h):
 z=surface(x,y);rod('Pine trunk',(x,y,z),(x,y,z+h*.88),h*.045,bark)
 for k in range(4):
  size=h*(.32-k*.06);height=h*(.48-k*.055);bottom=z+h*(.20+k*.19)
  bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=size,radius2=0,depth=height,location=(x,y,bottom+height/2),rotation=(0,0,random.random()))
  o=bpy.context.object;o.name='Faceted pine canopy';o.data.materials.append(pine[k%4])
for i in range(63):
 x=random.uniform(-9,9);y=random.uniform(-.8,4.4)
 if (x/9.6)**2+(y/4.8)**2>.93:continue
 if -2.8<x<3.5 and y<2:continue
 tree(x,y,random.uniform(2.2,4.9)*(1.1 if y>1 else .8))
for x,y,h in [(-7,-2.3,3.5),(-8.4,-1.9,4.7),(6.4,-1.1,3.7),(8,-.6,4.2),(-5,-1.1,2.8)]:tree(x,y,h)
for i in range(90):
 x=random.uniform(-9.4,9.4);y=random.uniform(-4,4)
 if (x/9.7)**2+(y/4.6)**2<1:
  s=random.uniform(.12,.5);ico('Scattered boulder',(x,y,surface(x,y)+s*.25),(s,s*.8,s*.6),random.choice(rock))
# A-frame tent: front faces the visitor (negative Blender Y).
x,y=0.15,-.10;z=surface(x,y)+.1;w=1.65;h=2.15;length=2.5
tv=[(x-w,y-length/2,z),(x+w,y-length/2,z),(x,y-length/2,z+h),(x-w,y+length/2,z),(x+w,y+length/2,z),(x,y+length/2,z+h)]
mesh('Tent canvas',tv,[(0,3,5),(0,5,2),(1,2,5),(1,5,4),(3,4,5)],[canvas,canvas2])
mesh('Tent warm opening',[(x-w*.94,y-length/2-.01,z),(x+w*.94,y-length/2-.01,z),(x,y-length/2-.01,z+h*.95)],[(0,1,2)],[dark])
mesh('Tent open left flap',[(x-w,y-length/2-.04,z),(x-.53,y-length/2-.06,z),(x,y-length/2-.04,z+h)],[(0,1,2)],[canvas2])
mesh('Tent open right flap',[(x+w,y-length/2-.04,z),(x+.60,y-length/2-.06,z),(x,y-length/2-.04,z+h)],[(0,1,2)],[canvas])
for yy in [y-length/2-.1,y+length/2+.1]:
 rod('Tent timber pole',(x-w-.13,yy,z),(x+.14,yy,z+h+.25),.045,wood)
 rod('Tent timber pole',(x+w+.13,yy,z),(x-.14,yy,z+h+.25),.045,wood)
rod('Ridgepole',(x,y-length/2-.3,z+h),(x,y+length/2+.3,z+h),.055,wood)
cube('Bedroll',(.1,-.55,z+.14),(1.1,.7,.14),canvas2)
# Campfire, logs, stools, lamps and an approach path.
fx,fy=2.8,-1.45;fz=surface(fx,fy)
for i in range(12):
 a=i*math.tau/12;ico('Fire ring',(fx+.68*math.cos(a),fy+.68*math.sin(a),fz+.15),(.22,.19,.18),rock[i%len(rock)])
for a in [.3,2.5,4.5]:rod('Firewood',(fx-.47*math.cos(a),fy-.47*math.sin(a),fz+.15),(fx+.47*math.cos(a),fy+.47*math.sin(a),fz+.23),.11,wood)
for i in range(5):
 a=i*math.tau/5;ico('Flame',(fx+.22*math.cos(a),fy+.22*math.sin(a),fz+.67),(.28,.28,.85),fire)
ico('Flame core',(fx,fy,fz+.53),(.34,.34,.59),ember)
for px,py in [(4.15,-1.5),(2.9,.05)]:
 zz=surface(px,py);rod('Stool',(px,py,zz),(px,py,zz+.45),.25,wood);cube('Stool seat',(px,py,zz+.45),(.7,.5,.1),wood)
for i in range(8):
 px=-.1+i*.14;py=-1.7-i*.25;cube('Path stepping plank',(px,py,surface(px,py)+.065),(.85,.19,.07),wood)
for px,py in [(-1.8,-1.4),(1.9,-.8),(-3.8,-2.8),(4.8,-2.8)]:
 zz=surface(px,py);rod('Lantern post',(px,py,zz),(px,py,zz+.85),.04,wood);cube('Lantern housing',(px,py,zz+.88),(.19,.19,.29),wood);cube('Lantern glow',(px,py-.025,zz+.91),(.14,.17,.19),glow)
for i in range(180):
 px=random.uniform(-9.2,9.2);py=random.uniform(-3.9,3.9)
 if (px/9.5)**2+(py/4.5)**2>.96 or (-2<px<4 and -2<py<1):continue
 zz=surface(px,py);h=random.uniform(.10,.24)
 mesh('Grass blades',[(px-.07,py,zz),(px+.04,py,zz),(px,py,zz+h),(px,py-.05,zz),(px,py+.06,zz),(px+.04,py,zz+h*.8)],[(0,1,2),(3,4,5)],[random.choice(grass)])
# Keep the editable scene easy to navigate in Blender.
groups={name:bpy.data.collections.new(name) for name in ['01 Terrain and stream','02 Forest','03 Campsite and fire','04 Rocks and grass']}
for collection in groups.values():bpy.context.scene.collection.children.link(collection)
for obj in list(bpy.context.scene.objects):
 if any(word in obj.name for word in ['Pine','canopy']):key='02 Forest'
 elif any(word in obj.name for word in ['island','crag','creek','Waterfall']):key='01 Terrain and stream'
 elif any(word in obj.name for word in ['boulder','Grass']):key='04 Rocks and grass'
 else:key='03 Campsite and fire'
 for collection in list(obj.users_collection):collection.objects.unlink(obj)
 groups[key].objects.link(obj)
bpy.ops.object.select_all(action='DESELECT')
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.shading.color_type='MATERIAL'
   area.spaces.active.region_3d.view_distance=26
   area.spaces.active.region_3d.view_location=(0,0,0)
   area.spaces.active.region_3d.view_rotation=Vector((0,-1,.55)).to_track_quat('Z','Y')
# Save the editable original and the web-ready asset.
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'assets','three-moons-landscape.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(root,'assets','legacy-models','landscape.glb'),export_format='GLB',export_apply=True,export_yup=True)
print('Landscape model and editable Blender source exported.')
