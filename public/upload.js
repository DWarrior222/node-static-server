$(function() {
    var formData = new FormData()

    $('#file').change(function (e) {
        var file = $(e.target)[0]
        formData.append('nss', file.files[0])
        
        console.log(formData.getAll('nss'))

    })

    $('#upload-btn').click(function (e) {
        console.log(formData.getAll('nss'))
        $.ajax({
            type: "POST",
            url: '/admin/uploadFile',
            // contentType: 'multipart/form-data',
            data: formData,
            // 如果要发送 DOM 树信息或其它不希望转换的信息，请设置为 false。
            processData: false,
            contentType: false,
        }).done(function(res) {
            console.log(res)
            if (res.code === 10001) {
                alert(res.msg)
            }
            $('#img-url').text('上传成功，url 为：http://' + location.host + res.url_list[0])
            alert('上传成功，url 为：http://' + location.host + res.url_list[0])
        }).fail(function(res) {
            console.log(res)
            alert('网络错误')
        })
    })
})
  