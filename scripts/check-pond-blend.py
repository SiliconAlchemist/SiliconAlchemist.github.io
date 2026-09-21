"""Validate geometry repairs in the saved, editable Blender deliverable."""
import bpy,bmesh
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root/'assets/pond-island.blend'),use_scripts=False)
terrain=bpy.data.objects['GEO_Terrain']
assert {'grass_top','rocky_bottom'}.issubset({g.name for g in terrain.vertex_groups})
rocks=[o for o in bpy.context.scene.objects if o.get('role')=='pond_rock']
assert len(rocks)==26
for o in [terrain,*rocks]:
    bm=bmesh.new();bm.from_mesh(o.data)
    assert all(f.calc_area()>1e-9 for f in bm.faces),o.name+' degenerate faces'
    assert all(e.is_manifold for e in bm.edges),o.name+' open or nonmanifold edge'
    assert bm.calc_volume()>0,o.name+' inverted shell'
    bm.free()
pond=bpy.data.objects['FX_Pond']
assert max(v.co.z for v in pond.data.vertices)-min(v.co.z for v in pond.data.vertices)<1e-6
assert all(p.normal.z>.999 for p in pond.data.polygons)
assert 'UVMap' in pond.data.uv_layers
assert 'Paint' in pond.data.color_attributes
assert sum(o.get('role')=='canopy' for o in bpy.context.scene.objects)==16
assert sum(o.get('role')=='trunk' for o in bpy.context.scene.objects)==16
assert bpy.data.objects.get('SOCKET_Fire_01') and bpy.data.objects.get('SOCKET_House_01')
assert not bpy.data.objects.get('FX_River') and not bpy.data.objects.get('FX_Waterfall')
print('PASS: 26 closed stones, closed terrain, preserved groups, level upward pond, 16 complete trees and effect sockets.')
