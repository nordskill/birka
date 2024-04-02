import BibeEditor from '../../components/bibe-editor';

export default async function () {

   const editor = new BibeEditor({
      element: '.post_editor',
      update_url: '/api/update'
   });

}