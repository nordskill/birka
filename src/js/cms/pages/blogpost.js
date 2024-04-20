import BibeEditor from '../../components/bibe-editor';
import FileCRUD from '../../components/file-crud';

export default async function () {

   const updateURL = document.querySelector('.post_editor').dataset.updateUrl;

   const post = JSON.parse(document.getElementById('blogpost_data').innerHTML);

   new FileCRUD({
      container: '.option-1',
      files_api: '/api/files/',
      endpoint: '/api/blog/' + post._id,
      file: post.img_preview,
      file_id: post.img_preview?._id || "",
      size: 300
   })

   new BibeEditor({
      container: '.post_editor',
      update_url: updateURL,
      token: document.querySelector('meta[name="csrf"]').content
   });


}