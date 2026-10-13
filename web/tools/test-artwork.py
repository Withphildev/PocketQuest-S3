import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from PIL import Image
module=importlib.util.spec_from_file_location('prepare_artwork',Path(__file__).with_name('prepare-artwork.py'));art=importlib.util.module_from_spec(module);module.loader.exec_module(art)
class ArtworkTests(unittest.TestCase):
    def test_no_silent_crop(self):
        with self.assertRaisesRegex(ValueError,'cropReason'):art.compose_layer(Image.new('RGBA',(40,40)),{'crop':[0,0,20,20],'scale':'1/2'})
    def test_uniform_scale(self):
        self.assertEqual(art.compose_layer(Image.new('RGBA',(40,20)),{'crop':[0,0,40,20],'scale':'1/2'}).size,(20,10))
        with self.assertRaises(ValueError):art.compose_layer(Image.new('RGBA',(41,20)),{'crop':[0,0,41,20],'scale':'1/2'})
    def test_candidate_requires_explicit_flag(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaisesRegex(ValueError,'--candidate'):art.prepare(Path(__file__).parents[1]/'artwork-sources/recipe.json',Path(d))
    def test_reproducible_complete_asset_outputs(self):
        recipe=Path(__file__).parents[1]/'artwork-sources/recipe.json'
        with tempfile.TemporaryDirectory() as a,tempfile.TemporaryDirectory() as b:
            ra=art.prepare(recipe,Path(a),True);rb=art.prepare(recipe,Path(b),True);self.assertEqual(ra,rb)
            for name in ra['outputs']:self.assertEqual((Path(a)/name).read_bytes(),(Path(b)/name).read_bytes())
            master=Image.open(Path(a)/'F002-Sunlit-Forest-Master.png');self.assertEqual(master.size,(1024,288));self.assertEqual(master.getchannel('A').getextrema(),(255,255))
            joined=Image.new('RGBA',(1024,288));joined.paste(Image.open(Path(a)/'F002-Sunlit-Forest-Left.png'),(0,0));joined.paste(Image.open(Path(a)/'F002-Sunlit-Forest-Right.png'),(512,0));self.assertEqual(master.tobytes(),joined.tobytes())
            tree=Image.open(Path(a)/'Sunlit-Tree.png');self.assertEqual(tree.size,(128,160));low,high=tree.getchannel('A').getextrema();self.assertEqual(low,0);self.assertGreater(high,0)
if __name__=='__main__':unittest.main()
