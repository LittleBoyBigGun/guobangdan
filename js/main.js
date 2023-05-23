
function layout(arr, col) {

  let tmparr = []
  let tmp = []

  for (i = 0; i < arr.length; i ++) {
    let subind = i % col
    tmp.push(arr[i])
    if (subind === col - 1 || i === arr.length - 1) {
      tmparr.push(tmp)
      tmp = []
    }
  }
  $('table').empty()
  tmparr.forEach((l, i) => {
    var tr = $('<tr></tr>').addClass('row' + i)
    l.forEach(item => {
      tr.append($('<td></td>').text(item))
    })

    tr.appendTo($('table'))
  })
}

function rand_between(max, min) {
  return Math.random() * (max - min) + min;
}


function randn(mean, std) {
  var u1;
  var u2;
  var a;
  var b;
  do {
    u1 = Math.random();
    u2 = Math.random();
  } while (u1 === 0.0);
  a = Math.sqrt(-2.0 * Math.log(u1));
  b = 2 * Math.PI * u2;
  r = a * Math.cos(b); // cache for next call
  return (a * Math.sin(b))*std + mean;
}

function randn_between(mean, std, max, min) {

  while(1) {
    var r = randn(mean, std)
    if (r > min && r < max) return r 
  }
}

function g(mean, std, max, min, n, dupc, error) {

  var ret = []
  var duptunecount= 0
  var sumtunecount= 0
  while (1) {

    var res = mean * n
    var i = n

    for (j = 0; j < n; j ++) {
      var curitem = parseFloat(randn_between(mean, std, max, min).toFixed(1))
      res -= curitem
      i = n - j - 1
      
      //如果参数选取的不恰当，会卡死， 这里防止卡死
      sumtunecount += 1
      if (sumtunecount >= 10000) {
        error({reason:'too_many_sum_tune', count:sumtunecount})
        ret = []
        break
      }

      var res_ave = res / i
      if (res_ave > min && res_ave < max) {
        ret.push(curitem)
      } else { // 退回
        j = j - 1
        res += curitem
        i = i + 1
      }
      if (j === n - 2) {
        ret.push(parseFloat(res.toFixed(1)))
        sumtunecount = 0
        break
      }
    }

    //直接跳出 while , 因为参数选择错误，不用在循环了
    if (sumtunecount >= 10000) {
      break
    }
    duptunecount += 1
    if (duptunecount >= 1000) {
      error({reason:"too_many_dup_tune", count:duptunecount})
      ret = []
      break
    }
    var maxcount = 0
    var mincount = 0
    ret.forEach(val => {
      if (val === max) 
        maxcount += 1
      
      if (val === min) 
        mincount += 1
    })

    if (maxcount < dupc && mincount < dupc) {
      duptunecount = 0
      break
    }

    ret = []
  }

  return ret
}


function generate() {
  var c_str = $('#count').prop('value').trim()
  var c = c_str=== '' ? 0 : parseInt(c_str)

  var pizhong = parseFloat($('#pizhong').prop('value').trim())

  var weight_net_str = $('#weight').prop('value').trim()
  var weight_net = weight_net_str === ''? 0 : parseFloat(weight_net_str)

  var stdm_str = $('#stdm').prop('value').trim()
  var stdm = parseFloat(stdm_str)

  var ave = weight_net / c

  var ret = g(ave, stdm, 90-pizhong, 50-pizhong, c, 3, (error)=>{
    if (error.reason === 'too_many_sum_tune') {
      alert('无法找到满足要求的方案，请调整数量')
    }
    if (error.reason === 'too_many_dup_tune') {
      alert('无法找到满足要求的方案，请调下标差')
    }
  })

  //返回的是净重
  return ret 
}

function make_echarts_values(val){
  var ret = []
  val.forEach((v,i)=>{
    ret.push([(i+1).toString(), v]) 
  })
  return ret
}

function sum(arr) {
  var s = 0
  arr.forEach(item=>{
    s += item
  })
  return s
}

function check_count() {
    var n = parseInt($('#weight').prop('value').trim())
    var c = parseFloat($('#count').prop('value').trim())

    var max = Math.ceil(n/50)
    var min = Math.ceil(n/90) 
    
    if (c < min)  {
      alert('车的数量过小, 应该为 '+ min + ' - '+ max +' 之间')
    } else if (c > max) {
      alert('车的数量过大, 应该为 '+ min + ' - '+ max +' 之间')
    }
}

$(document).ready(function () {


  var myChart = echarts.init(document.getElementById('holder'));

  //矫正车数

  $('#weight').on('change', function(){
    check_count()
  })

  $('#cal').on('click', (event) => {
    
    check_count()
    //净重数组
    var nws = generate()    

    if (nws.length === 0) {
      return
    }

    //皮重
    var pz = parseFloat($('#pizhong').prop('value').trim())
    //毛重数组
    var mzs = nws.map(val=>{
      return parseFloat((val + pz).toFixed(1))
    })
    //总净重
    var nw = sum(nws)  
    //包装重
    var bzz = pz*nws.length
    //毛重
    var mz = bzz + nw

    layout(mzs, 9)

    $('.result').empty()
    //净重
    $('<p>净重:'+Math.round(nw)+'</p>').appendTo('.result')
    //车数
    $('<p>车数:'+mzs.length+'</p>').appendTo('.result')
    //皮重
    $('<p>皮重:'+pz+'</p>').appendTo('.result')
    //毛重
    $('<p>毛重:'+Math.round(mz)+'</p>').appendTo('.result')
    //包装重
    $('<p>包装重:'+Math.round(bzz)+'</p>').appendTo('.result')

    var option = {
      legend: {},
      tooltip: {},
      dataset:{
        source:make_echarts_values(mzs)
      },
      xAxis: {
         type: 'category'
      },
      yAxis: {},
      series: [
        {
          type: 'line',
          smooth: true,
        }
      ]
    };

    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
  })
})

