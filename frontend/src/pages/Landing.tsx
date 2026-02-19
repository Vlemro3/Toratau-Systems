import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const Landing: React.FC = () => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.contrastText',
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                T
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ fontWeight: 700, letterSpacing: 0.3 }}
                >
                  Toratau
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  Контроль денег и бригад
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="text"
                color="inherit"
                size="small"
                href="/login"
              >
                Войти
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="small"
                href="/register"
              >
                Зарегистрироваться
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* HERO SECTION */}
        <Box
          component="section"
          sx={{
            pt: { xs: 6, md: 10 },
            pb: { xs: 6, md: 10 },
            bgcolor:
              theme.palette.mode === 'light'
                ? 'grey.50'
                : theme.palette.background.default,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={3}>
                  <Chip
                    label="SaaS для строительных компаний"
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                  />

                  <Typography
                    variant={isMdUp ? 'h3' : 'h4'}
                    component="h1"
                    sx={{ fontWeight: 800, lineHeight: 1.1 }}
                  >
                    Контроль прибыли
                    <br />
                    на каждом объекте
                  </Typography>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ maxWidth: 520 }}
                  >
                    Toratau помогает строительным компаниям видеть реальные
                    деньги, контролировать бригады и исключать перерасход.
                    Никакого хаоса в Excel и споров по выплатам — только
                    прозрачная экономика объектов.
                  </Typography>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      href="/register"
                      endIcon={<ArrowForwardIcon />}
                    >
                      Попробовать бесплатно
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="large"
                      href="/login"
                    >
                      Войти
                    </Button>
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ mt: 1 }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ maxWidth: 260 }}
                    >
                      14 дней бесплатно, без карты. Подходит для подрядчиков,
                      девелоперов и компаний с несколькими объектами.
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                {/* Mock dashboard */}
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor:
                      theme.palette.mode === 'light'
                        ? 'background.paper'
                        : 'grey.900',
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      Объект: ЖК «Торатау Сити»
                    </Typography>
                    <Chip
                      label="План-факт в норме"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                  <CardContent sx={{ p: 2.5 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Card
                          variant="outlined"
                          sx={{ borderRadius: 2, height: '100%' }}
                        >
                          <CardContent sx={{ p: 1.5 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Маржа по объекту
                            </Typography>
                            <Typography
                              variant="h5"
                              sx={{ fontWeight: 700, mt: 0.5 }}
                            >
                              +18,4%
                            </Typography>
                            <Typography
                              variant="caption"
                              color="success.main"
                            >
                              +2,1% к плану
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Card
                          variant="outlined"
                          sx={{ borderRadius: 2, height: '100%' }}
                        >
                          <CardContent sx={{ p: 1.5 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Начислено бригадам
                            </Typography>
                            <Typography
                              variant="h5"
                              sx={{ fontWeight: 700, mt: 0.5 }}
                            >
                              4 320 000 ₽
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              92% от утверждённого бюджета
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Card
                          variant="outlined"
                          sx={{ borderRadius: 2, height: '100%' }}
                        >
                          <CardContent sx={{ p: 1.5 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Выполнено работ
                            </Typography>
                            <Typography
                              variant="h5"
                              sx={{ fontWeight: 700, mt: 0.5 }}
                            >
                              127
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              8 задач в работе
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 1, display: 'block' }}
                      >
                        Последние движения
                      </Typography>
                      <Stack spacing={1}>
                        {[
                          {
                            label: 'Начисление за бетонные работы · Бригада №4',
                            amount: '+ 240 000 ₽',
                            color: 'success.main',
                          },
                          {
                            label: 'Выплата по закрытому этапу · Бригада №2',
                            amount: '− 180 000 ₽',
                            color: 'error.main',
                          },
                          {
                            label: 'Корректировка сметы · Монтаж перекрытий',
                            amount: '+ 60 000 ₽',
                            color: 'warning.main',
                          },
                        ].map((row, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              px: 1.5,
                              py: 1,
                              borderRadius: 1.5,
                              bgcolor:
                                theme.palette.mode === 'light'
                                  ? 'grey.50'
                                  : 'grey.900',
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{ maxWidth: '70%' }}
                            >
                              {row.label}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: row.color }}
                            >
                              {row.amount}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* БЛОК ПРОБЛЕМЫ */}
        <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg">
            <Grid
              container
              spacing={4}
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ letterSpacing: 1, fontWeight: 600 }}
                >
                  ПРОБЛЕМА
                </Typography>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 700, mt: 1 }}
                >
                  Вы теряете деньги на объектах?
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  Даже прибыльные объекты «съедаются» перерасходами, путаницей
                  в учёте и несогласованными выплатами бригадам.
                  Непрозрачность в цифрах — главный источник потерь.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Grid container spacing={2}>
                  {[
                    'Нет прозрачности по бригадам',
                    'Прорабы считают в Excel',
                    'Нет реального план-факт',
                    'Конфликты по выплатам',
                  ].map((item) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: '100%',
                          borderRadius: 2,
                          borderStyle: 'dashed',
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {item}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Toratau заменяет разрозненные файлы и устные
                            договорённости единым источником правды по
                            каждому объекту и бригаде.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* РЕШЕНИЕ / ФУНКЦИОНАЛ */}
        <Box
          component="section"
          sx={{
            py: { xs: 6, md: 8 },
            bgcolor:
              theme.palette.mode === 'light'
                ? 'grey.50'
                : theme.palette.background.paper,
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={2} sx={{ mb: 4 }}>
              <Typography
                variant="overline"
                color="primary"
                sx={{ letterSpacing: 1, fontWeight: 600 }}
              >
                РЕШЕНИЕ
              </Typography>
              <Typography
                variant="h5"
                component="h2"
                sx={{ fontWeight: 700 }}
              >
                Toratau даёт полный финансовый контроль
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 620 }}
              >
                Все данные по выполненным работам, начислениям и выплатам в
                одной системе. Вы видите план-факт, прибыль и историю действий
                по каждому объекту без дополнительных файлов и переписок.
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              {[
                'Учёт выполненных работ',
                'Автоматический расчёт начислений',
                'Контроль выплат бригадам',
                'План-факт анализ',
                'Лог действий (AuditLog)',
                'Управление несколькими объектами',
              ].map((feature) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature}>
                  <Card
                    variant="outlined"
                    sx={{ borderRadius: 2, height: '100%' }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1.5,
                        }}
                      >
                        <CheckIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        {feature}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: 13 }}
                      >
                        Торгово-производственная логика уже заложена в
                        систему: вам остаётся только вносить данные и
                        контролировать результат.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* КАК ЭТО РАБОТАЕТ */}
        <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ letterSpacing: 1, fontWeight: 600 }}
                >
                  ПРОСТОЙ СТАРТ
                </Typography>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 700, mt: 1 }}
                >
                  Как это работает
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  Toratau создавался вместе с подрядчиками и прорабами.
                  Запуск занимает пару часов, а не недели внедрения. Вся
                  команда быстро привыкает к понятным сценариям работы.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Grid container spacing={2}>
                  {[
                    {
                      step: '1',
                      title: 'Создайте объект',
                      text: 'Задайте бюджет, бригады и ключевые этапы работ. Настройте права доступа для офиса и прорабов.',
                    },
                    {
                      step: '2',
                      title: 'Добавляйте выполненные работы',
                      text: 'Прорабы фиксируют объёмы, система автоматически считает начисления и показывает отклонения от плана.',
                    },
                    {
                      step: '3',
                      title: 'Видите прибыль в реальном времени',
                      text: 'На одном экране — маржа, выплаты и план-факт по каждому объекту и всей компании.',
                    },
                  ].map((item) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={item.step}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          height: '100%',
                          position: 'relative',
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {item.step}
                          </Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, mb: 1.5, pr: 4 }}
                          >
                            {item.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: 13 }}
                          >
                            {item.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ДЛЯ КОГО / ПРЕИМУЩЕСТВА */}
        <Box
          component="section"
          sx={{
            py: { xs: 6, md: 8 },
            bgcolor:
              theme.palette.mode === 'light'
                ? 'grey.50'
                : theme.palette.background.paper,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ letterSpacing: 1, fontWeight: 600 }}
                >
                  ДЛЯ КОГО
                </Typography>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 700, mt: 1 }}
                >
                  Кому подходит Toratau
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 3 }}>
                  {[
                    'Малые подрядчики',
                    'Девелоперы',
                    'Компании с несколькими объектами',
                  ].map((item) => (
                    <Box
                      key={item}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: 'primary.contrastText',
                          }}
                        />
                      </Box>
                      <Typography variant="body2">{item}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ letterSpacing: 1, fontWeight: 600 }}
                >
                  ПРЕИМУЩЕСТВА
                </Typography>
                <Typography
                  variant="h5"
                  component="h3"
                  sx={{ fontWeight: 700, mt: 1 }}
                >
                  Почему компании выбирают Toratau
                </Typography>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {[
                    {
                      title: 'Экономия 3–7% бюджета',
                      text: 'Сокращение перерасходов за счёт прозрачного учёта и контроля план-факт по каждому объекту.',
                    },
                    {
                      title: 'Прозрачность выплат',
                      text: 'Каждая выплата бригаде опирается на зафиксированные объёмы работ и утверждённые расценки.',
                    },
                    {
                      title: 'Контроль без микроменеджмента',
                      text: 'Руководство видит картину по объектам, не погружаясь в операционные мелочи.',
                    },
                    {
                      title: 'Всё в одной системе',
                      text: 'Объекты, бригады, работы, начисления, выплаты и история действий — в едином интерфейсе.',
                    },
                  ].map((item) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.title}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          height: '100%',
                          borderColor: 'transparent',
                          bgcolor:
                            theme.palette.mode === 'light'
                              ? 'common.white'
                              : 'grey.900',
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          >
                            {item.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: 13 }}
                          >
                            {item.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ТАРИФЫ */}
        <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg">
            <Stack spacing={2} sx={{ mb: 4, textAlign: 'center' }}>
              <Typography
                variant="overline"
                color="primary"
                sx={{ letterSpacing: 1, fontWeight: 600 }}
              >
                ТАРИФЫ
              </Typography>
              <Typography
                variant="h5"
                component="h2"
                sx={{ fontWeight: 700 }}
              >
                Простая линейка тарифов
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 600, mx: 'auto' }}
              >
                Начните с бесплатного периода и выберите тариф, который
                соответствует масштабу вашей компании и количеству объектов.
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              {[
                {
                  name: 'Start',
                  subtitle: 'Для малых подрядчиков',
                  price: 'от 0 ₽',
                  features: [
                    'До 1 объекта',
                    'До 3 бригад',
                    'Учёт работ и выплат',
                    'Базовый план-факт',
                  ],
                  highlighted: false,
                },
                {
                  name: 'Business',
                  subtitle: 'Оптимально для роста',
                  price: 'по запросу',
                  features: [
                    'До 5 объектов',
                    'Неограниченное число бригад',
                    'Расширенный план-факт анализ',
                    'Лог действий (AuditLog)',
                  ],
                  highlighted: true,
                },
                {
                  name: 'Pro',
                  subtitle: 'Для девелоперов и холдингов',
                  price: 'по запросу',
                  features: [
                    'Безлимит по объектам',
                    'Ролевые модели доступа',
                    'Интеграции и API',
                    'Персональный менеджер',
                  ],
                  highlighted: false,
                },
              ].map((plan) => (
                <Grid size={{ xs: 12, md: 4 }} key={plan.name}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      height: '100%',
                      borderColor: plan.highlighted
                        ? 'primary.main'
                        : 'divider',
                      boxShadow: plan.highlighted ? 4 : 0,
                      position: 'relative',
                    }}
                  >
                    {plan.highlighted && (
                      <Chip
                        label="Популярный выбор"
                        color="primary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                        }}
                      />
                    )}
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      >
                        {plan.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {plan.subtitle}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2 }}
                      >
                        {plan.price}
                      </Typography>
                      <Stack spacing={1.2} sx={{ mb: 3 }}>
                        {plan.features.map((feature) => (
                          <Box
                            key={feature}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <CheckIcon
                              sx={{ fontSize: 18, color: 'primary.main' }}
                            />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {feature}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                      <Button
                        variant={plan.highlighted ? 'contained' : 'outlined'}
                        color="primary"
                        fullWidth
                        href="/register"
                      >
                        Начать бесплатно
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* FAQ */}
        <Box
          component="section"
          sx={{
            py: { xs: 6, md: 8 },
            bgcolor:
              theme.palette.mode === 'light'
                ? 'grey.50'
                : theme.palette.background.paper,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ letterSpacing: 1, fontWeight: 600 }}
                >
                  FAQ
                </Typography>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 700, mt: 1 }}
                >
                  Часто задаваемые вопросы
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  Если у вас остались вопросы по запуску или тарифам, мы с
                  удовольствием поможем. Ниже — ответы на самые частые.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Stack spacing={1.5}>
                  {[
                    {
                      q: 'Сколько времени занимает внедрение Toratau?',
                      a: 'Как правило, базовый запуск занимает 1–2 дня: вы создаёте объекты, добавляете бригады и загружаете актуальные данные. Прорабы начинают фиксировать работы уже в первую неделю.',
                    },
                    {
                      q: 'Нужны ли изменения в бухгалтерском учёте?',
                      a: 'Нет. Toratau не заменяет бухгалтерию, а дополняет её управленческим учётом по объектам и бригадам. Вы можете выгружать данные для бухгалтерии в удобном формате.',
                    },
                    {
                      q: 'Как считать расценки и начисления бригадам?',
                      a: 'В системе задаются расценки по видам работ. При вводе выполненного объёма Toratau автоматически рассчитывает начисления по каждому этапу и бригаде.',
                    },
                    {
                      q: 'Можно ли работать с несколькими объектами одновременно?',
                      a: 'Да. Toratau изначально спроектирован для компаний с несколькими объектами. Вы видите как детализацию по каждому объекту, так и агрегированную картину по всей компании.',
                    },
                    {
                      q: 'Как обеспечивается безопасность данных?',
                      a: 'Все данные передаются по защищённым каналам, доступ разграничивается по ролям, а каждая операция фиксируется в журнале действий (AuditLog).',
                    },
                    {
                      q: 'Что делает Toratau лучше Excel и мессенджеров?',
                      a: 'В отличие от Excel и чатов, Toratau хранит все данные структурировано, не допускает потери информации и даёт прозрачный план-факт анализ в режиме реального времени.',
                    },
                    {
                      q: 'Есть ли обучение для команды?',
                      a: 'Да. Мы предоставляем краткие инструкции для офиса и прорабов, а также можем провести онлайн-сессию по запуску и первым шагам в системе.',
                    },
                    {
                      q: 'Можно ли отказаться после тестового периода?',
                      a: 'Да. Тестовый период не обязывает вас к оплате. Если вы поймёте, что пока не готовы, вы можете выгрузить свои данные и вернуться позже.',
                    },
                  ].map((item, index) => (
                    <Accordion
                      key={index}
                      disableGutters
                      square={false}
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:before': { display: 'none' },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          px: 2,
                          '& .MuiAccordionSummary-content': {
                            my: 1,
                          },
                        }}
                      >
                        <Typography variant="subtitle2">
                          {item.q}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 2, pb: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: 13.5 }}
                        >
                          {item.a}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ФИНАЛЬНЫЙ CTA */}
        <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg">
            <Card
              elevation={4}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor:
                  theme.palette.mode === 'light'
                    ? 'primary.main'
                    : 'primary.dark',
                color: 'primary.contrastText',
              }}
            >
              <Grid container>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Box sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      Начните контролировать прибыль уже сегодня
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.9, maxWidth: 460, mb: 3 }}
                    >
                      Подключите Toratau, чтобы видеть реальные деньги по
                      каждому объекту, управлять выплатами бригадам и
                      принимать решения на основании цифр, а не ощущений.
                    </Typography>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                    >
                      <Button
                        variant="contained"
                        color="inherit"
                        href="/register"
                        sx={{
                          color: 'primary.main',
                          fontWeight: 600,
                        }}
                      >
                        Создать портал бесплатно
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        href="/login"
                        sx={{
                          borderColor: 'rgba(255,255,255,0.6)',
                          color: 'inherit',
                        }}
                      >
                        Войти
                      </Button>
                    </Stack>
                    <Typography
                      variant="caption"
                      sx={{ mt: 2, display: 'block', opacity: 0.8 }}
                    >
                      14 дней бесплатно. Без обязательств и привязки карты.
                    </Typography>
                  </Box>
                </Grid>
                <Grid
                  size={{ xs: 12, md: 5 }}
                  sx={{
                    borderLeft: {
                      xs: 'none',
                      md: '1px solid rgba(255,255,255,0.16)',
                    },
                    display: 'flex',
                    alignItems: 'stretch',
                  }}
                >
                  {/* Мини mock-дашборд в CTA */}
                  <Box
                    sx={{
                      p: { xs: 3, md: 4 },
                      width: '100%',
                      bgcolor: 'rgba(0,0,0,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.9, mb: 0.5 }}
                    >
                      Пример дашборда Toratau
                    </Typography>
                    <Card
                      sx={{
                        borderRadius: 2,
                        bgcolor: 'rgba(0,0,0,0.16)',
                        color: 'inherit',
                        boxShadow: 'none',
                      }}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="caption">
                            Прибыль по объектам
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ opacity: 0.8 }}
                          >
                            месяц
                          </Typography>
                        </Stack>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, mt: 0.5 }}
                        >
                          + 4 800 000 ₽
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'success.light' }}
                        >
                          +6,2% к плану
                        </Typography>
                      </CardContent>
                    </Card>
                    <Grid container spacing={1}>
                      {['Объекты', 'Бригады', 'Выплаты'].map((label, idx) => (
                        <Grid size={{ xs: 4 }} key={label}>
                          <Card
                            sx={{
                              borderRadius: 2,
                              bgcolor: 'rgba(0,0,0,0.16)',
                              color: 'inherit',
                              boxShadow: 'none',
                            }}
                          >
                            <CardContent sx={{ p: 1.25 }}>
                              <Typography
                                variant="caption"
                                sx={{ opacity: 0.8 }}
                              >
                                {label}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {idx === 0
                                  ? '7'
                                  : idx === 1
                                  ? '24'
                                  : '3,9 млн ₽'}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Container>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          py: 2,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} Toratau. Все права защищены.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Сервис для контроля денег и бригад в строительстве.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
