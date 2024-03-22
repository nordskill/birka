import BibeEditor from '../../components/bibe-editor';

export default async function () {

   if (!document.querySelector('.post_editor')) return;
   const editor = new BibeEditor('.post_editor');

}