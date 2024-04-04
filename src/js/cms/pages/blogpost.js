import BibeEditor from '../../components/bibe-editor';

export default async function () {

   const updateURL = document.querySelector('.post_editor').dataset.updateUrl;

   new BibeEditor({
      container: '.post_editor',
      update_url: updateURL,
      token: document.querySelector('meta[name="csrf"]').content
   });

}