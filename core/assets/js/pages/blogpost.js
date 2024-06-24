import BibeEditor from '../components/bibe-editor';
import FileCRUD from '../components/file-crud';
import TagsCRUD from "../components/tags-crud";

export default async function () {

   const updateURL = document.querySelector('.post_editor').dataset.updateUrl;

   const post = JSON.parse(document.getElementById('blogpost_data').innerHTML);

   new FileCRUD({
      container: '.option-1',
      files_api: '/api/files/',
      endpoint: '/api/blog/' + post._id,
      field_name: 'img_preview',
      file: post.img_preview,
      file_id: post.img_preview?._id || "",
      size: 300
   });

   new TagsCRUD('.tags_crud');

   new BibeEditor({
      container: '.post_editor',
      update_url: updateURL,
      token: document.querySelector('meta[name="csrf"]').content
   });

}